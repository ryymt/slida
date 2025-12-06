class Slida {
    constructor(selector, options = {}) {
        this.container =
            typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;

        if (!this.container) {
            console.error('Slida: container element not found');
            return;
        }

        this.track = this.container.querySelector('.slida_track');
        this.originalSlides = Array.from(
            this.track.querySelectorAll('.slida_slide')
        );

        const defaults = {
            interval: 3000,
            arrows: false,
            dots: false,
        };

        this.settings = { ...defaults, ...options };

        this.current = 0;
        this.prev = 0;
        this.timer = null;

        // クローン表示中かどうかのフラグ
        this.isCloneActive = false;

        this.progress = 0;
        this.isDragging = false;
        this.startX = 0;
        this.delta = 0;
        this.width = this.container.clientWidth;

        this.addSlideIndex();
        this.cloneSlides();

        if (this.settings.arrows) this.createArrows();
        if (this.settings.dots) this.createDots();

        this.disableImageDrag();
        this.start();
    }

    addSlideIndex() {
        this.originalSlides.forEach((slide, index) => {
            slide.dataset.slideIndex = index;
        });
    }

    cloneSlides() {
        const clonesBefore = this.originalSlides.map((slide) => {
            const clone = slide.cloneNode(true);
            clone.classList.add('slida_slide--clone');
            return clone;
        });

        const clonesAfter = this.originalSlides.map((slide) => {
            const clone = slide.cloneNode(true);
            clone.classList.add('slida_slide--clone');
            return clone;
        });

        clonesBefore.reverse().forEach((clone) => {
            this.track.insertBefore(clone, this.track.firstChild);
        });

        clonesAfter.forEach((clone) => {
            this.track.appendChild(clone);
        });
    }

    createDots() {
        const dotsWrapper = document.createElement('div');
        dotsWrapper.classList.add('slida_dots');

        this.dots = this.originalSlides.map((slide, index) => {
            const button = document.createElement('button');
            button.classList.add('slida_dot');
            button.dataset.dotIndex = index;
            button.innerHTML = `<span class="slida_dot_text">${
                index + 1
            }</span>`;
            dotsWrapper.appendChild(button);

            button.addEventListener('click', () => {
                this.goToSlide(index);
                this.restartTimer();
            });

            return button;
        });

        this.container.appendChild(dotsWrapper);
        this.updateActiveDots();
    }

    createArrows() {
        const arrowsWrapper = document.createElement('div');
        arrowsWrapper.classList.add('slida_arrows');

        const btnPrev = document.createElement('button');
        btnPrev.classList.add('slida_arrow', 'slida_arrow--prev');
        btnPrev.textContent = 'Prev';

        const btnNext = document.createElement('button');
        btnNext.classList.add('slida_arrow', 'slida_arrow--next');
        btnNext.textContent = 'Next';

        arrowsWrapper.append(btnPrev, btnNext);
        this.container.appendChild(arrowsWrapper);

        btnPrev.addEventListener('click', () => {
            this.prevSlide();
            this.restartTimer();
        });

        btnNext.addEventListener('click', () => {
            this.nextSlide();
            this.restartTimer();
        });
    }

    start() {
        this.updateActiveSlide();
        this.timer = setInterval(
            () => this.nextSlide(),
            this.settings.interval
        );
    }

    restartTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(
            () => this.nextSlide(),
            this.settings.interval
        );
    }

    nextSlide() {
        this.prev = this.current;

        // ★変更: 最後のスライドにいる場合
        if (this.current === this.originalSlides.length - 1) {

            // 1. まずクローン（最初のスライドのコピー）へアニメーション移動させる
            this.isCloneActive = true;
            this.current = 0; // 論理位置は0に戻す
            this.updateActiveSlide(true); // アニメーションありで更新

            // 2. CSSアニメーションが終わったタイミングで、即座に本物のスライド0へ差し替える
            const onTransitionEnd = () => {
                // クローンモード解除
                this.isCloneActive = false;

                // アニメーション（Transition）を一時的に無効化
                this.track.style.transition = 'none';

                // 本物のスライド0を表示状態にする（見た目は変わらない）
                this.updateActiveSlide(false);

                // 少し待ってからTransition設定を元に戻す（次の移動のため）
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.track.style.transition = '';
                    });
                });
            };

            // transitionendイベントで上記処理を一度だけ実行
            this.track.addEventListener('transitionend', onTransitionEnd, {
                once: true,
            });

            return;
        }

        // 通常動作
        this.current = (this.current + 1) % this.originalSlides.length;
        this.updateActiveSlide(true);
    }

    prevSlide() {
        this.isCloneActive = false; // 手動操作時はクローンモード解除
        this.prev = this.current;
        this.current =
            (this.current - 1 + this.originalSlides.length) %
            this.originalSlides.length;
        this.updateActiveSlide(true);
    }

    goToSlide(index) {
        this.isCloneActive = false; // 手動操作時はクローンモード解除
        this.prev = this.current;
        this.current = index;
        this.updateActiveSlide(true);
    }

    updateActiveSlide(withTransition = false) {
        const allSlides = Array.from(
            this.track.querySelectorAll('.slida_slide')
        );

        // すべての状態クラスを削除
        allSlides.forEach((slide) => {
            slide.classList.remove(
                'is-active',
                'is-prev',
                'is-next',
                'is-visible'
            );
        });

        // ★変更: アクティブにする要素の特定
        let active;

        if (this.isCloneActive) {
            // クローンモード時は、最後のオリジナルスライドの「次（＝最初のクローン）」を取得
            const lastOriginal =
                this.originalSlides[this.originalSlides.length - 1];
            active = lastOriginal.nextElementSibling;
        } else {
            // 通常時は、現在のインデックスに対応するオリジナルスライドを取得
            active = this.track.querySelector(
                `.slida_slide[data-slide-index="${this.current}"]:not(.slida_slide--clone)`
            );
        }

        if (!active) return;

        active.classList.add('is-active', 'is-visible');

        const prev = active.previousElementSibling;
        const next = active.nextElementSibling;

        if (prev) prev.classList.add('is-prev', 'is-visible');
        if (next) next.classList.add('is-next', 'is-visible');

        if (this.settings.dots) this.updateActiveDots();
    }

    updateActiveDots() {
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('is-current', index === this.current);
        });
    }

    // ---------------------------------
    // ドラッグ / フリック
    // ---------------------------------
    bindDragEvents() {
        this.container.addEventListener('mousedown', this.onStart.bind(this));
        this.container.addEventListener('touchstart', this.onStart.bind(this), {
            passive: true,
        });

        window.addEventListener('mousemove', this.onMove.bind(this));
        window.addEventListener('touchmove', this.onMove.bind(this), {
            passive: false,
        });

        window.addEventListener('mouseup', this.onEnd.bind(this));
        window.addEventListener('touchend', this.onEnd.bind(this));
    }

    onStart(e) {
        this.isDragging = true;
        this.startX = this.getX(e);
        this.delta = 0;
        clearInterval(this.timer);
    }

    onMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();

        const x = this.getX(e);
        this.delta = x - this.startX;
        this.progress = this.delta / this.width;

        this.container.style.setProperty('--progress', this.progress);
    }

    onEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;

        if (this.progress > 0.2) {
            this.prevSlide();
        } else if (this.progress < -0.2) {
            this.nextSlide();
        }

        this.progress = 0;
        this.container.style.setProperty('--progress', 0);
        this.restartTimer();
    }

    getX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }

    disableImageDrag() {
        this.container.querySelectorAll('img').forEach((img) => {
            img.addEventListener('dragstart', (e) => e.preventDefault());
        });
    }
}

// export default Slida;
