class Slida {
    constructor(selector, options = {}) {
        // selectorが文字列ならquerySelector、要素ならそのまま
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
        this.timer = null;

        this.addSlideIndex();
        this.cloneSlides();

        if (this.settings.arrows) this.createArrows();
        if (this.settings.dots) this.createDots();

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
        this.current = (this.current + 1) % this.originalSlides.length;
        this.updateActiveSlide();
    }

    prevSlide() {
        this.current =
            (this.current - 1 + this.originalSlides.length) %
            this.originalSlides.length;
        this.updateActiveSlide();
    }

    goToSlide(index) {
        this.current = index;
        this.updateActiveSlide();
    }

    updateActiveSlide() {
        this.originalSlides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === this.current);
        });

        if (this.settings.dots) this.updateActiveDots();
    }

    updateActiveDots() {
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('is-active', index === this.current);
        });
    }
}

const slidael = document.querySelector('.slida');
new Slida(slidael, {
    interval: 1000,
    arrows: true,
    dots: true,
});
