import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const PORT=process.env.PORT||5000;
app.use(cors({origin:process.env.FRONTEND_URL||'https://kisan-setu-y12h.vercel.app'}));
app.use(express.json({limit:'2mb'}));
const uploadDir=path.join(__dirname,'uploads'); if(!fs.existsSync(uploadDir))fs.mkdirSync(uploadDir,{recursive:true});
const storage=multer.diskStorage({destination:(_,__,cb)=>cb(null,uploadDir),filename:(_,file,cb)=>{const safe=file.originalname.replace(/[^a-z0-9.\-_]/gi,'_');cb(null,`${Date.now()}-${safe}`)}});
const allowed=['application/pdf','image/jpeg','image/png'];
const upload=multer({storage,fileFilter:(_,file,cb)=>allowed.includes(file.mimetype)?cb(null,true):cb(new Error('Only PDF, JPG and PNG files are supported.')),limits:{fileSize:5*1024*1024}});
const requireDemoAuth=(req,res,next)=>{const token=req.headers['x-demo-token'];if(token!=='demo-token')return res.status(401).json({message:'Unauthorized document access.'});next()};
let farmers=[]; let calculations=[]; let payments=[]; let otpStore=new Map();
app.get('/api/health',(_,res)=>res.json({ok:true,service:'Kisan Setu API',time:new Date().toISOString()}));
app.post('/api/auth/login',(req,res)=>{const {mobile,password}=req.body||{};if(!/^[6-9]\d{9}$/.test(mobile||''))return res.status(400).json({message:'Invalid Indian mobile number.'});if(!String(password||'').trim())return res.status(400).json({message:'Password is required.'});const farmer=farmers.find(f=>f.mobile===mobile)||{name:'Demo Farmer',mobile,farmerId:'KS-DEMO'};res.json({success:true,token:'demo-token',farmer});});
app.post('/api/auth/send-otp',(req,res)=>{const mobile=req.body?.mobile||'';if(!/^[6-9]\d{9}$/.test(mobile))return res.status(400).json({message:'Invalid Indian mobile number.'});const otp=process.env.NODE_ENV==='production'?String(Math.floor(100000+Math.random()*900000)):'123456';otpStore.set(mobile,{otp,expires:Date.now()+5*60*1000});res.json({success:true,message:'OTP sent',demo:process.env.NODE_ENV==='production'?undefined:otp});});
app.post('/api/auth/verify-otp',(req,res)=>{const {mobile,otp}=req.body||{};const record=otpStore.get(mobile);if(!record||Date.now()>record.expires)return res.status(400).json({message:'OTP expired. Please request a new OTP.'});if(record.otp!==String(otp))return res.status(400).json({message:'Invalid OTP.'});otpStore.delete(mobile);const farmer=farmers.find(f=>f.mobile===mobile)||{name:'Demo Farmer',mobile,farmerId:'KS-DEMO'};res.json({success:true,token:'demo-token',farmer});});
app.post('/api/farmers/register',upload.fields([{name:'aadhaar'},{name:'satbara'},{name:'eightA'},{name:'ownership'},{name:'cropRecord'},{name:'soilCard'}]),(req,res)=>{const data=req.body;if(!String(data.password||'').trim())return res.status(400).json({message:'Password is required.'});const farmer={...data,id:`KS-${Date.now()}`,createdAt:new Date().toISOString(),documents:req.files||{}};farmers.push(farmer);res.status(201).json({success:true,farmer});});
app.post('/api/documents',upload.single('document'),(req,res)=>{if(!req.file)return res.status(400).json({message:'No document uploaded.'});res.status(201).json({success:true,file:{name:req.file.originalname,url:`/documents/${req.file.filename}`,filename:req.file.filename,size:req.file.size,mimetype:req.file.mimetype,status:'Uploaded',uploadedAt:new Date().toISOString()}})});
app.get('/api/documents/:filename',requireDemoAuth,(req,res)=>{const file=path.join(uploadDir,path.basename(req.params.filename));if(!fs.existsSync(file))return res.status(404).json({message:'Document not found.'});res.sendFile(file)});
app.delete('/api/documents/:filename',requireDemoAuth,(req,res)=>{const file=path.join(uploadDir,path.basename(req.params.filename));if(fs.existsSync(file))fs.unlinkSync(file);res.json({success:true})});
app.post('/api/calculations',(req,res)=>{const c=req.body;const total=['seed','fertilizer','pesticide','labour','irrigation','transport','other'].reduce((s,k)=>s+(Number(c[k])||0),0);const revenue=(Number(c.yield)||0)*(Number(c.price)||0);const result=revenue-total;const out={...c,totalExpenses:total,revenue,result,createdAt:new Date().toISOString()};calculations.push(out);res.status(201).json(out)});
app.get('/api/market-prices',async(_,res)=>{
  if(process.env.MARKET_API_URL){
    try{const r=await fetch(process.env.MARKET_API_URL,{headers:{accept:'application/json'}});if(!r.ok)throw new Error();const data=await r.json();return res.json({...data,source:data.source||'Configured market provider',lastUpdated:new Date().toISOString()});}catch{return res.status(502).json({message:'Market price provider unavailable.'});}
  }
  if(process.env.MARKET_DEMO==='true'){return res.json({source:'Demo data — not live market data',lastUpdated:new Date().toISOString(),prices:[{crop:'Soybean',market:'Hinganghat APMC',price:4850,change:5.2},{crop:'Cotton',market:'Akola APMC',price:7420,change:2.8},{crop:'Wheat',market:'Nagpur APMC',price:2510,change:-1.1},{crop:'Tur',market:'Yavatmal APMC',price:6750,change:3.6}]});}
  return res.status(503).json({message:'No approved market price provider is configured.'});
});app.get('/api/weather',async(req,res)=>{const lat=Number(req.query.lat),lon=Number(req.query.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))return res.status(400).json({message:'Valid latitude and longitude are required.'});try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability&forecast_days=1&timezone=auto`);if(!r.ok)throw new Error();const data=await r.json();res.json({source:'Open-Meteo',lastUpdated:new Date().toISOString(),data});}catch{res.status(502).json({message:'Weather service unavailable.'})}});

app.post('/api/payments/create',(req,res)=>{const {amount,method}=req.body||{};if(!(Number(amount)>0))return res.status(400).json({message:'Valid amount required.'});const payment={id:`KS${Date.now()}`,reference:req.body?.reference||`KS-${Date.now()}`,amount:Number(amount),method,status:'Pending',createdAt:new Date().toISOString()};payments.push(payment);res.status(201).json({success:true,payment});});
app.post('/api/payments/:id/verify',(req,res)=>{const p=payments.find(x=>x.id===req.params.id);if(!p)return res.status(404).json({message:'Payment not found.'});p.status='Pending';p.lastCheckedAt=new Date().toISOString();res.json({success:true,payment:p,verified:false,message:'Payment confirmation requires a legitimate provider or bank callback.'})});
app.get('/api/payments',(req,res)=>res.json({payments}));
app.use((err,_,res,__)=>res.status(400).json({message:err?.message||'Request failed'}));
app.listen(PORT,()=>console.log(`Kisan Setu backend running on http://localhost:${PORT}`));
