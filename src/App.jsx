import { useEffect, useState } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { EventBus } from './game/EventBus';
import {Ysdk} from "./Ysdk.js";
import Database from "./Database.js";
import Load from "./Load.jsx";
import "./pause.css"
import Pause from "./Pause.jsx";
const db = new Database();
export default function App() {
  const [ui, setUi] = useState({ mode: 'menu', score: db.getAll().score, best: db.getAll().best, canRevive: false });
  const [lang, setLang] = useState('ru');
  const [error, setError] = useState(null);
  const [ysdk, setYsdk] = useState(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {

    (async () => {
      try {
        const isYsdk = window.location.href.includes("yandex.ru");
        let ysdkInstance = null;
        let lang = 'ru'; // Дефолтный язык
        let progress = {}; // Дефолтный прогресс

        if (isYsdk) {
          // --- РЕАЛЬНЫЙ SDK (только для Яндекс Игр) ---
          const sdkWrapper = new Ysdk();
          setYsdk(sdkWrapper)
          // Инициализация
          ysdkInstance = await sdkWrapper.getInstance();

          // Язык
          lang = await sdkWrapper.getLang();

          // Прогресс игрока
          const player = await ysdkInstance.getPlayer();
          if (player) {
            progress = await player.getData();
            if(progress.score){
              db.setScore(progress.score)
              db.setBest(progress.best)
              console.log(progress)
            }
          }

          // Сообщаем платформе, что игра готова
          await sdkWrapper.ready();
          console.log('[DEV] SDK ');
        } else {
          // --- ЛОКАЛЬНАЯ РАЗРАБОТКА ---
          console.log('[DEV] Запуск в режиме локальной разработки. SDK отключен.');
          // Здесь можно явно подгрузить тестовые данные, если нужно
          // progress = { level: 5, score: 100 };
        }

        // --- ОБЩАЯ ЛОГИКА (одинакова для обоих режимов) ---

        setLang(lang);
        setLoad(true);
      } catch (err) {
        console.error('Критическая ошибка инициализации:', err);
        setError(err.message);
      }
    })();
  }, []);

  useEffect(() => {

    const onOver = (d) => setUi({ ...d, mode: 'over' });
    EventBus.on('over', onOver);
    return () => { EventBus.off('over', onOver); };
  }, []);

  useEffect(() => {
    console.log(load);
  },[load])

  const play = (withAd) => {
    const go = () => { setUi((u) => ({ ...u, mode: 'playing' })); EventBus.emit('start');ysdk?.start(); };
    if (withAd)ysdk?ysdk?.fullscreenAdv(go):go(); else go();


  };
  const revive = () => {
    ysdk?.rewardedVideo(()=>{
      setUi((u) => ({ ...u, mode: 'playing' }));
      EventBus.emit('revive');
    })
  };

  function pause(){
    setUi((u) => ({ ...u, mode: 'pause' }));
    EventBus.emit('pause')
    ysdk?.stop()
  }

  function resume(){
    setUi((u) => ({ ...u, mode: 'playing' }));
    EventBus.emit('resume')
    ysdk?.start()
  }

if(!load){
  return <Load/>
}else {
  return (
      <PhaserGame>
        {ui.mode !== 'playing' && (
            <div className="ov">
              <div className="card">
                {ui.mode === 'menu' ? (
                    <>
                      <h1>Пельменная башня</h1>
                      <p>Тапайте или жмите пробел, чтобы уронить пельмень. Два пельменя одного цвета исчезают при касании. С высотой дует ветер.</p>
                      <button onClick={() => play(false)}>Играть</button>
                    </>
                ) :ui.mode === 'pause'?(<div>
                  <Pause play={resume} />
                </div>): (
                    <>
                      <h1>Ой!</h1>
                      <p>Очки: {ui.score}. Рекорд: {ui.best}.</p>
                      {ui.canRevive && <button className="alt" onClick={revive}>Продолжить за рекламу</button>}
                      <button onClick={() => play(true)}>Ещё раз</button>
                    </>
                )}
              </div>
            </div>
        )}
        {ui.mode === 'playing'?<button onPointerDown={pause} id="pause-open" className="pause-open" aria-label="Пауза">
          <i></i><i></i>
        </button>:""}
      </PhaserGame>
  );
}

}
