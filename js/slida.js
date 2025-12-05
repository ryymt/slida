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
        this.bindDragEvents();
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
            button.textContent = index + 1;
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
        this.current = (this.current + 1) % this.originalSlides.length;
        this.updateActiveSlide(true);
    }

    prevSlide() {
        this.prev = this.current;
        this.current =
            (this.current - 1 + this.originalSlides.length) %
            this.originalSlides.length;
        this.updateActiveSlide(true);
    }

    goToSlide(index) {
        this.prev = this.current;
        this.current = index;
        this.updateActiveSlide(true);
    }

    updateActiveSlide(withTransition = false) {
        const isLoopBack =
            this.prev === this.originalSlides.length - 1 && this.current === 0;

        if (isLoopBack && withTransition) {
            this.track.classList.remove('is-animating');
            this.track.style.transition = 'none'; // アニメーションOFF

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.track.classList.add('is-animating');
                    this.track.style.transition = ''; // アニメーションON
                });
            });
        }

        this.originalSlides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === this.current);
        });

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

// --------------------------------
// Example
// --------------------------------
const slidael = document.querySelector('.slida');
new Slida(slidael, {
    interval: 1000,
    arrows: true,
    dots: true,
});
