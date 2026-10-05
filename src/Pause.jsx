import "./pause.css"
import {useEffect, useState} from "react";
import Database from "./Database.js";
const db = new Database()
export default function Pause({play}){
    const [sound, setSound] = useState(parseFloat(db.getAll().effect))
    const [music, setMusic] = useState(parseFloat(db.getAll().music))

    useEffect(()=>{
        db.setMusic(music)
        db.setEffect(sound)
    },[sound,music])

    return <>
        <div id="pause" role="dialog" aria-modal="true" aria-labelledby="pause-title" >
            <div className="pause-card">
                <h2 id="pause-title">Пауза</h2>
                <p>Башня подождёт.</p>
                <div className={"range"}>
                    <div className={"icon"}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                             className="bi bi-volume-up" viewBox="0 0 16 16">
                            <path
                                d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                            <path
                                d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                            <path
                                d="M10.025 8a4.486 4.486 0 0 1-1.318 3.182L8 10.475A3.489 3.489 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.486 4.486 0 0 1 10.025 8zM7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12V4zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11z"/>
                        </svg>
                    </div>
                    <input value={music} onChange={(e)=>setMusic(parseFloat(e.target.value))} className={"input"} type={"range"} step={0.01} min={0} max={1}/>
                </div>
                <div className={"range"}>
                    <div className={"icon"}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                             className="bi bi-music-note-beamed" viewBox="0 0 16 16">
                            <path
                                d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z"/>
                            <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z"/>
                            <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z"/>
                        </svg>
                    </div>
                    <input value={sound} onChange={(e)=>setSound(parseFloat(e.target.value))} className={"input"} type={"range"} step={0.01} min={0} max={1}/>
                </div>
                <button onPointerDown={play} className="pause-btn" id="pause-resume">Продолжить</button>
            </div>
        </div>
    </>
}