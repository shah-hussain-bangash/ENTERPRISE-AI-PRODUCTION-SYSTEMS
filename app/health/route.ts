import {GET as getHealth} from '../api/health/route';
export const dynamic='force-dynamic';
export function GET(){return getHealth()}
