import { Injectable, Logger } from '@nestjs/common'; import { ConfigService } from '@nestjs/config'; import * as nodemailer from 'nodemailer';
@Injectable() export class EmailService { private log=new Logger(EmailService.name); constructor(private config:ConfigService){}
 async sendTaskCreated(to:string,title:string){ return this.send(to,'Task created: '+title,`Your task “${title}” was created successfully.`); }
 async sendTaskDone(to:string,title:string){ return this.send(to,'Task completed: '+title,`Your task “${title}” has been marked as done.`); }
 private async send(to:string,subject:string,text:string){ const host=this.config.get('SMTP_HOST'), user=this.config.get('SMTP_USER'), pass=this.config.get('SMTP_PASS'); if(!host||!user||!pass){this.log.warn('SMTP not configured; email skipped'); return;} const transporter=nodemailer.createTransport({host,port:Number(this.config.get('SMTP_PORT')||587),secure:Number(this.config.get('SMTP_PORT')||587)===465,auth:{user,pass}}); await transporter.sendMail({from:this.config.get('MAIL_FROM')||user,to,subject,text}); }
}
