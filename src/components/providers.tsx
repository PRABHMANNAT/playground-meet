'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {MotionConfig,AnimatePresence,motion} from 'motion/react';
import {X} from 'lucide-react';
const ToastContext=createContext<(message:string)=>void>(()=>{});
export const useToast=()=>useContext(ToastContext);
export function Providers({children}:{children:React.ReactNode}){const [toast,setToast]=useState('');const notify=useCallback((message:string)=>setToast(message),[]);useEffect(()=>{if(!toast)return;const timeout=setTimeout(()=>setToast(''),6000);return()=>clearTimeout(timeout);},[toast]);return <MotionConfig reducedMotion="user"><ToastContext value={notify}>{children}<AnimatePresence>{toast&&<motion.div className="toast" role="status" initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} exit={{opacity:0}}>{toast}<button aria-label="Dismiss notification" onClick={()=>setToast('')}><X size={18}/></button></motion.div>}</AnimatePresence></ToastContext></MotionConfig>;}
