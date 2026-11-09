import {randomUUID} from 'node:crypto';
import type {Handler} from './context';
import {invariant} from '../errors';
export const poll:Handler=async({room},a)=>{if(a.type!=='poll')return;invariant(room.state.polls.length<30,409,'This meeting has reached its 30 poll limit.');invariant(new Set(a.options).size===a.options.length,400,'Poll options must be different.');room.state.polls.push({id:randomUUID(),question:a.question,options:a.options,votes:{},closed:false});};
