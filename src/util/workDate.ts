//const WeekDaysCor = ['do','lu','ma','mi','ju','vi','sa'];
const WeekDaysCom = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const WeekDaysComEst = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
//const MonthsLetCor = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const MonthsLetCom = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
//const MonthsNum = ['01','02','03','04','05','06','07','08','09','10','11','12'];

export const ajustarFechaHora = (now: Date) => {
  const cuatroHoras = 4 * 60 * 60 * 1000;
  return new Date(now.getTime() - cuatroHoras);
};

function separateDateAndTimeSis(dateTimeString: string) {
    const [date, time] = dateTimeString.split('T');
    const [hours, minutes, secondsWithOffset] = time.split(':');
    const [seconds] = secondsWithOffset.split(/[Z+-]/);
    const [year, month, day] = date.split('-');
    let offset = 0;
    const offsetMatch = dateTimeString.match(/([+-]\d{4})$/);
    if (offsetMatch) { offset = parseInt(offsetMatch[1], 10); }
    const localHours = parseInt(hours, 10) + offset / 100;

    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const h = Number(hours);
    const min = Number(minutes);
    const s = Math.round(Number(seconds));

    const cuatroHorasEnMs = 4 * 60 * 60 * 1000;
    const timestamp = new Date(y, m - 1, d, localHours, min, s);
    const timestampMenos4Horas = new Date(timestamp.getTime() - cuatroHorasEnMs);
    const dayOfWeek = timestampMenos4Horas.getDay();
    
    return {
        ddmmyyyA: `${d > 9 ? d : `0${d}`}-${m > 9 ? m : `0${m}`}-${y}`,
        ddmmyyyB: `${d > 9 ? d : `0${d}`}/${m > 9 ? m : `0${m}`}/${y}`,
        yyyymmddA: `${y}-${m > 9 ? m : `0${m}`}-${d > 9 ? d : `0${d}`}`,
        yyyymmddB: `${y}/${m > 9 ? m : `0${m}`}/${d > 9 ? d : `0${d}`}`,
        hhmmss: `${h > 9 ? h : `0${h}`}:${min > 9 ? min : `0${min}`}:${s > 9 ? s : `0${s}`}`,
        hhmm: `${h > 9 ? h : `0${h}`}:${min > 9 ? min : `0${min}`}`,
        pdf:`${WeekDaysCom[dayOfWeek]}, ${d} de ${MonthsLetCom[m-1]} del ${y} a las ${h > 9 ? h : `0${h}`}:${min > 9 ? min : `0${min}`}`,
        gf: `${y}${m > 9 ? m : `0${m}`}${d > 9 ? d : `0${d}`}`,
        gfh: `${y}-${m > 9 ? m : `0${m}`}-${d > 9 ? d : `0${d}`} ${h > 9 ? h : `0${h}`}:${min > 9 ? min : `0${min}`}:${s > 9 ? s : `0${s}`}`,
        timestamp: timestamp,
    };
}

function separateDateAndTimeSel(date: string, time: string) { 
    const [year, month, day] = date.split('-');
    const [hours, minutes, seconds = "0"] = time.split(':');

    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const h = Number(hours);
    const min = Number(minutes);
    const s = Math.round(Number(seconds));

    const timestamp = time == "" ? new Date(y, m - 1, d, 0, 0, 0, 0) : new Date(y, m - 1, d, h, min, s);
    const dayOfWeek = timestamp.getDay();

    return {
        ddmmyyyA: `${day}-${month}-${year}`,
        ddmmyyyB: `${day}/${month}/${year}`,
        yyyymmddA: `${year}-${month}-${day}`,
        yyyymmddB: `${year}/${month}/${day}`,
        dayOfWeek: dayOfWeek,
        dayOfWeekEst: WeekDaysComEst[dayOfWeek],
        pdf:`${WeekDaysCom[dayOfWeek]}, ${day} de ${MonthsLetCom[Number(month)-1]} del ${year}`,
        pdfGFH:`${WeekDaysCom[dayOfWeek]}, ${day} de ${MonthsLetCom[Number(month)-1]} del ${year} a las ${hours}:${minutes}:${seconds}`,
        gf: `${year}${month}${day}`,
        timestamp: timestamp,
    }
}

export {separateDateAndTimeSel, separateDateAndTimeSis}