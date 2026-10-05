// Обёртка над Yandex Games SDK. Вне Яндекса (локальный dev) работает как заглушка.
// В index.html должен быть: <script src="/sdk.js"></script>
let ysdk = null;

export async function initYandex() {
  try {
    if (!window.YaGames) return;
    ysdk = await window.YaGames.init();
    ysdk.features?.LoadingAPI?.ready?.();
  } catch (e) {
    console.warn('Yandex SDK недоступен', e);
  }
}

export const YG = {
  gameStart() { try { ysdk?.features?.GameplayAPI?.start(); } catch { /* noop */ } },
  gameStop() { try { ysdk?.features?.GameplayAPI?.stop(); } catch { /* noop */ } },
  showInterstitial(done) {
    if (!ysdk) return done();
    ysdk.adv.showFullscreenAdv({ callbacks: { onClose: () => done(), onError: () => done() } });
  },
  showRewarded(onReward) {
    if (!ysdk) return onReward(); // в dev награда выдаётся сразу
    let ok = false;
    ysdk.adv.showRewardedVideo({
      callbacks: { onRewarded: () => { ok = true; }, onClose: () => { if (ok) onReward(); }, onError: () => {} },
    });
  },
  async submitScore(n) {
    try { const lb = await ysdk?.getLeaderboards(); await lb?.setScore('best', n); } catch { /* нужна авторизация */ }
  },
};
