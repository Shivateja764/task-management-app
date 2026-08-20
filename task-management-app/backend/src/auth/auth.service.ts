import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';
@Injectable() export class AuthService {
 constructor(private prisma:PrismaService, private jwt:JwtService){}
 private token(user:any){ return this.jwt.sign({sub:user.id,email:user.email,name:user.name}); }
 async register(dto:RegisterDto){ const email=dto.email.toLowerCase(); const exists=await this.prisma.user.findUnique({where:{email}}); if(exists) throw new ConflictException('Email already registered'); const password=await bcrypt.hash(dto.password,12); const user=await this.prisma.user.create({data:{name:dto.name.trim(),email,password},select:{id:true,name:true,email:true}}); return {user,token:this.token(user)}; }
 async login(dto:LoginDto){ const user=await this.prisma.user.findUnique({where:{email:dto.email.toLowerCase()}}); if(!user || !(await bcrypt.compare(dto.password,user.password))) throw new UnauthorizedException('Invalid email or password'); const safe={id:user.id,name:user.name,email:user.email}; return {user:safe,token:this.token(safe)}; }
}
