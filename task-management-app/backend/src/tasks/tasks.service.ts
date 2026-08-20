import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { WeatherService } from '../weather/weather.service';
import { CloudinaryService } from '../storage/cloudinary.service';

import {
  CreateTaskDto,
  TaskQueryDto,
  TaskStatus,
  UpdateTaskDto,
} from './task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly weather: WeatherService,
    private readonly cloud: CloudinaryService,
  ) {}

  private readonly include = {
    attachments: true,
  };

  async list(userId: string, q: TaskQueryDto) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(q.limit) || 10));

    const where: any = { userId };

    if (q.status) {
      where.status = q.status;
    }

    if (q.priority) {
      where.priority = q.priority;
    }

    if (q.search) {
      where.OR = [
        {
          title: {
            contains: q.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: q.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (q.startDate || q.endDate) {
      where.dueDate = {};

      if (q.startDate) {
        where.dueDate.gte = new Date(q.startDate);
      }

      if (q.endDate) {
        where.dueDate.lte = new Date(q.endDate);
      }
    }

    const orderBy: any = {
      createdAt: 'desc',
    };

    if (q.sort === 'dueDate') {
      orderBy.dueDate = 'asc';
    }

    if (q.sort === 'priority') {
      orderBy.priority = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: this.include,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.task.count({
        where,
      }),
    ]);

    const tasks = await Promise.all(
      data.map(async (task: any) => ({
        ...task,
        weather: await this.weather.byCity(task.location || undefined),
      })),
    );

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async get(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        userId,
      },
      include: this.include,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return {
      ...task,
      weather: await this.weather.byCity(task.location || undefined),
    };
  }

  async create(
    userId: string,
    email: string,
    dto: CreateTaskDto,
    files: Express.Multer.File[] = [],
  ) {
    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        location: dto.location,
      },
      include: this.include,
    });

    if (files.length > 0) {
      const uploaded = await Promise.all(
        files.map((file) => this.cloud.upload(file)),
      );

      await this.prisma.attachment.createMany({
        data: uploaded.map((upload: any, index: number) => ({
          taskId: task.id,
          url: upload.secure_url,
          publicId: upload.public_id,
          fileName: files[index].originalname,
          mimeType: files[index].mimetype,
        })),
      });
    }

    await this.email
      .sendTaskCreated(email, task.title)
      .catch(() => undefined);

    return this.get(userId, task.id);
  }

  async update(
    userId: string,
    email: string,
    id: string,
    dto: UpdateTaskDto,
    files: Express.Multer.File[] = [],
  ) {
    const oldTask = await this.get(userId, id);

    const task = await this.prisma.task.update({
      where: {
        id,
      },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title.trim(),
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.status !== undefined && {
          status: dto.status,
        }),

        ...(dto.priority !== undefined && {
          priority: dto.priority,
        }),

        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),

        ...(dto.location !== undefined && {
          location: dto.location,
        }),
      },
    });

    if (files.length > 0) {
      const uploaded = await Promise.all(
        files.map((file) => this.cloud.upload(file)),
      );

      await this.prisma.attachment.createMany({
        data: uploaded.map((upload: any, index: number) => ({
          taskId: id,
          url: upload.secure_url,
          publicId: upload.public_id,
          fileName: files[index].originalname,
          mimeType: files[index].mimetype,
        })),
      });
    }

    if (
      oldTask.status !== TaskStatus.DONE &&
      dto.status === TaskStatus.DONE
    ) {
      await this.email
        .sendTaskDone(email, task.title)
        .catch(() => undefined);
    }

    return this.get(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Task deleted',
    };
  }
}