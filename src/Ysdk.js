

export class Ysdk {
    constructor() {
        this.ysdk = null;
        this._initPromise = null;
    }

    async getInstance() {
        if (this.ysdk) return this.ysdk;
        if (this._initPromise) return this._initPromise;
        const isYsdk = window.location.href.includes("yandex.ru");
        if (isYsdk && typeof YaGames === 'undefined') {
            throw new Error('YaGames SDK not found');
        }
    if(isYsdk){
        this._initPromise = YaGames.init().then(sdk => {
            this.ysdk = sdk;
            return sdk;
        });

        return this._initPromise;
    }

    }

    async getLang() {
        const ysdk = await this.getInstance();
        const rawLang = ysdk?.environment?.i18n?.lang;
        const supported = ['ru', 'en', 'tr', 'es', 'pt', 'id', 'vi', 'ar'];
        return supported.includes(rawLang) ? rawLang : 'ru';
    }

    ready() {
        return this.getInstance().then(ysdk => {
            if (ysdk?.features?.LoadingAPI) {
                ysdk.features.LoadingAPI.ready();
            }
        });
    }


    async start(){
      return  this.getInstance().then((ysdk) => {
          if (ysdk?.features?.LoadingAPI) {
              ysdk.features.GameplayAPI?.start()
          }
            });
    }

    save(data){
          return this.getInstance().then((ysdk)=>{
              if(ysdk?.getPlayer()){
                  ysdk.getPlayer().then((res)=>{
                      res.setData(data,true)
                  });
              }

          })
    }

    stop(){
      return  this.getInstance().then((ysdk) => {
          if (ysdk?.features?.LoadingAPI) {
              ysdk.features.GameplayAPI?.stop()
          }
            });
    }


    rewardedVideo(onChance){
        return  this.getInstance().then((ysdk) => {
            if (ysdk?.adv) {
                ysdk.adv.showRewardedVideo({
                    callbacks: {
                        onOpen: () => {
                            this.stop()
                            console.log('Открылось Пользователь получил награду.')
                        },
                        onRewarded: () => {

                        },
                        onClose: (wasShown) => {
                            this.start()
                             onChance()
                        },
                        onError: (error) => {

                        },
                    }
                })
            }
        });
    }

    fullscreenAdv(go){
        return  this.getInstance().then((ysdk) => {
            if (ysdk?.adv) {
                ysdk.adv.showFullscreenAdv({
                    callbacks: {
                        onOpen: () => {
                            this.stop()

                        },
                        onClose: (wasShown) => {
                            this.start()
                            go()

                        },
                        onError: (error) => {
                            this.start()
                            go()
                        },
                    }
                })
            }else {
                if(document.location.host.includes("localhost")){

                }

            }
        });
    }


}