import { Injectable, BadRequestException } from '@nestjs/common'; import { ConfigService } from '@nestjs/config'; import { v2 as cloudinary } from 'cloudinary'; import { Readable } from 'stream';
@Injectable() export class CloudinaryService { constructor(private config:ConfigService){}
 private ready(){ const cloud=this.config.get('CLOUDINARY_CLOUD_NAME'); const key=this.config.get('CLOUDINARY_API_KEY'); const secret=this.config.get('CLOUDINARY_API_SECRET'); if(!cloud||!key||!secret) throw new BadRequestException('Cloudinary is not configured'); cloudinary.config({cloud_name:cloud,api_key:key,api_secret:secret}); }
 async upload(file:Express.Multer.File){ this.ready(); return new Promise<any>((resolve,reject)=>{ const stream=cloudinary.uploader.upload_stream({resource_type:'auto',folder:'taskflow'},(err,result)=>err?reject(err):resolve(result)); Readable.from(file.buffer).pipe(stream); }); }
}
