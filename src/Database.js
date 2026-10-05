export default class Database {
    data = { score: 0, level: 1, music: 0.5, effect: 0.8, best:0, stars: [],levelOpen:1 };

    constructor() {
        this.name = 'dumpling-tower';
        this.init();
    }

    init() {
        const stored = window.localStorage.getItem(this.name);
        if (!stored) {
            this.save(this.data);
            return;
        }

        try {
            const parsed = JSON.parse(stored);

            // Если сохранённые данные не являются объектом — сбрасываем
            if (!parsed || typeof parsed !== 'object') {
                this.save(this.data);
                return;
            }

            // Объединяем дефолтные данные с сохранёнными:
            // 1. Дефолтные значения (this.data) гарантируют наличие всех новых полей
            // 2. Сохранённые значения (parsed) переопределяют дефолты
            const merged = { ...this.data, ...parsed };

            // Сохраняем обратно, чтобы записать отсутствовавшие поля в localStorage
            this.save(merged);
        } catch (e) {
            console.warn('Database: corrupted data, resetting', e);
            this.save(this.data);
        }
    }

    getAll() {
        const raw = window.localStorage.getItem(this.name);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    // Универсальный сеттер: атомарно обновляет и сохраняет
    update(updates) {
        const current = this.getAll() || this.data;
        const next = { ...current, ...updates };
        this.save(next);
        return next;
    }

    save(data) {
        window.localStorage.setItem(this.name, JSON.stringify(data));
    }

    setLevel(level = 1) {
        return this.update({ level });
    }

    setBest(best = 0) {
        return this.update({ best });
    }

    setScore(score = 0) {
        return this.update({ score });
    }

    setMusic(music = 0.5) {
        return this.update({ music });
    }

    setEffect(effect = 0.8) {
        return this.update({ effect });
    }

    setStars(count, index) {
        const currentData = this.getAll() || this.data;
        const stars = [...(currentData.stars || [])];
        const targetIndex = index - 1;

        if (targetIndex >= 0) {
            stars[targetIndex] = count;
        }

        return this.update({ stars });
    }

    updateStars(stars){
        return this.update({ stars });
    }

    setLevelOpen(levelOpen) {
        return this.update({ levelOpen });
    }

    remove() {
        window.localStorage.removeItem(this.name);
    }
}