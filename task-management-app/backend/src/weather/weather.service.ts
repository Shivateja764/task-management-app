import { Injectable, Logger } from '@nestjs/common'; import { ConfigService } from '@nestjs/config';
@Injectable() export class WeatherService { private log=new Logger(WeatherService.name); constructor(private config:ConfigService){}
 async byCity(city?:string){ if(!city) return null; const key=this.config.get('OPENWEATHER_API_KEY'); if(!key) return null; try{const r=await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`); if(!r.ok) return null; const d:any=await r.json(); return {temp:Math.round(d.main.temp),description:d.weather?.[0]?.description||'',icon:d.weather?.[0]?.icon||'',cityName:d.name};}catch(e){this.log.warn('Weather lookup failed');return null;} }
}
