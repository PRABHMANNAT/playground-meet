import type {Handler} from './context';
import {invariant} from '../errors';
export const notes:Handler=async({room},a)=>{if(a.type!=='notes')return;invariant(a.version===room.state.notesVersion,409,'Someone updated the notes. Copy your draft, then reload the latest notes.');room.state.notes=a.text;room.state.notesVersion++;};
