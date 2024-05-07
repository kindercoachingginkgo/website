/**
 * @mixin
 */
const Freeable = {
    free() {

    },

    addFreeAction(action) {
        const oldFreeFunction = this.free;
        this.free = () => {
            oldFreeFunction();
            action();
        }
    }
}

/**
 * @mixes Freeable
 */
class Carousel extends EventTarget {
    /**
     * @type {HTMLElement}
     */
    parentElement;
    /**
     * @type {Array}
     */
    itemElements;
    /**
     * Integer representing the page number. Zero based
     * @type {Number}
     */
    currentPageNumber = -1;
    /**
     * Amount of pages available
     * @type {Number}
     */
    amountOfPages;
    /**
     * The Width (Integer) of one page with the gap added to it.
     * @type {Number}
     */
    #pageWidth;
    /**
     * Amount of items that are being stored per page.
     * @type {Number}
     */
    #itemsPerPage;

    /**
     * 
     * @param {HTMLElement} parentElement 
     */
    constructor(parentElement) {
        super();

        this.parentElement = parentElement;
        this.itemElements = Array.from(parentElement.children);

        this.#calculatePageProperties();

        this.#listenForScrolling();
        this.#listenForResize();
    }

    /**
     * Fails silently if there is no next page
     */
    toNextPage() {
        if (this.currentPageNumber === this.amountOfPages) return;

        this.toPage(this.currentPageNumber + 1);
    }

    /**
     * Fails silently if there is no previous page
     */
    toPreviousPage() {
        if (this.currentPageNumber === 0) return;

        this.toPage(this.currentPageNumber - 1);
    }

    toCurrentPage() {
        this.toPage(this.currentPageNumber);
    }

    /**
     * Throws error when out of bounds
     * @param {Number} pageNumber 
     */
    toPage(pageNumber) {
        const adjustment = -5;
        this.parentElement.scrollTo((pageNumber * this.#pageWidth) + adjustment, 0)
    }

    #listenForResize() {
        let timeoutIdentifier;
        const resizeEventListener = () => {
            clearTimeout(timeoutIdentifier);
            timeoutIdentifier = setTimeout(() => {
                this.#calculatePageProperties();
            }, 200);
        }
        window.addEventListener("resize", resizeEventListener);

        this.addFreeAction(() => {
            window.removeEventListener("resize", resizeEventListener);
        });
    }

    #calculatePageProperties() {
        this.#calculatePageWidth();
        this.#calculateItemsPerPage();
        this.#calculateAmountOfPages();

        this.dispatchEvent(new Event("recalculatedProperties"));
    }

    #calculatePageWidth() {
        this.#pageWidth =
            this.parentElement.offsetWidth +
            parseInt(
                getComputedStyle(this.parentElement).gap
            );
    }

    #calculateItemsPerPage() {
        this.#itemsPerPage = this.#pageWidth / this.itemElements[0].offsetWidth;
    }

    #calculateAmountOfPages() {
        this.amountOfPages = this.itemElements.length / parseInt(this.#itemsPerPage);
    }

    #listenForScrolling() {
        let timeoutIdentifier;
        const scrollEventListener = () => {
            clearTimeout(timeoutIdentifier);
            timeoutIdentifier = setTimeout(this.calculateCurrentPageNumber.bind(this), 100);
        }
        this.parentElement.addEventListener("scroll", scrollEventListener);

        this.addFreeAction(() => {
            this.parentElement.removeEventListener("scroll", scrollEventListener);
        });
    }

    calculateCurrentPageNumber() {
        const adjustment = 50;
        const newCurrentPageNumber = parseInt((this.parentElement.scrollLeft + adjustment) / this.#pageWidth);

        if (newCurrentPageNumber !== this.currentPageNumber) {
            this.currentPageNumber = newCurrentPageNumber;
            this.dispatchEvent(new Event("change"));
        }
    }
}
Object.assign(Carousel.prototype, Freeable);


class ControlledCarousel extends Carousel {
    /**
     * @type {String}
     */
    static #selectedAbsoluteButtonClassName = "exp__controller__absolute__page--selected";
    /**
     * @type {HTMLButtonElement}
     */
    static #absoluteButtonElementExample = ControlledCarousel.#createExampleAbsoluteButtonElement();
    /**
     * @type {HTMLElement}
     */
    controllerElement;
    /**
     * @type {HTMLButtonElement[]}
     */
    absoluteButtonElements = [];

    /**
     * 
     * @param {HTMLElement} parentElement 
     * @param {HTMLElement} controllerElement 
     */
    constructor(parentElement, controllerElement) {
        super(parentElement);
        this.controllerElement = controllerElement;

        this.#setupAbsoluteButtonElements();
        this.#listenForCalculationOfProperties();

        this.#listenForPrevious();
        this.#listenForNext();

        this.#listenForPageChange();
        this.calculateCurrentPageNumber();

    }

    #listenForCalculationOfProperties() {
        const recalculatedPropertiesEventListener = () => {
            const buttonElements = this.absoluteButtonElements;
            for (let i = buttonElements.length - 1; i >= 0; --i) {
                buttonElements[i].remove();
            }
            this.absoluteButtonElements = [];
            this.#setupAbsoluteButtonElements();
            this.calculateCurrentPageNumber();
        }
        this.addEventListener("recalculatedProperties", recalculatedPropertiesEventListener);

        this.addFreeAction(() => {
            this.removeEventListener("recalculatedProperties", recalculatedPropertiesEventListener);
        });
    }

    #listenForPageChange() {
        const changeEventListener = () => {
            this.#removeAllSelectedModifiers();
            this.#addSelectedModifier();
        }
        this.addEventListener("change", changeEventListener);

        this.addFreeAction(() => {
            this.removeEventListener("change", changeEventListener);
        });
    }

    #removeAllSelectedModifiers() {
        this.controllerElement.querySelectorAll(`.${ControlledCarousel.#selectedAbsoluteButtonClassName}`).forEach((element) => {
            element.classList.remove(ControlledCarousel.#selectedAbsoluteButtonClassName);
        })
    }

    #addSelectedModifier() {
        this.absoluteButtonElements[this.currentPageNumber].classList.add(ControlledCarousel.#selectedAbsoluteButtonClassName);
    }

    #listenForPrevious() {
        const clickEventListener = this.toPreviousPage.bind(this);
        this.controllerElement.querySelector(".exp__controller__relative--previous").addEventListener("click", clickEventListener);

        this.addFreeAction(() => {
            this.controllerElement.querySelector(".exp__controller__relative--previous").removeEventListener("click", clickEventListener);
        })
    }

    #listenForNext() {
        const clickEventListener = this.toNextPage.bind(this);
        this.controllerElement.querySelector(".exp__controller__relative--next").addEventListener("click", clickEventListener);

        this.addFreeAction(() => {
            this.controllerElement.querySelector(".exp__controller__relative--next").removeEventListener("click", clickEventListener);
        })
    }

    #setupAbsoluteButtonElements() {
        const containerElement = document.querySelector(".exp__controller__absolute");
        for (let i = 0; i < this.amountOfPages; ++i) {
            const buttonElement = this.#createAbsoluteButtonElement();
            this.#listenForClickOnAbsoluteButtonElement(buttonElement, i);
            this.absoluteButtonElements.push(buttonElement);
            containerElement.appendChild(buttonElement);
        }
    }

    #createAbsoluteButtonElement() {
        return ControlledCarousel.#absoluteButtonElementExample.cloneNode(true);
    }

    /**
     * 
     * @returns {HTMLButtonElement}
     */
    static #createExampleAbsoluteButtonElement() {
        const buttonElement = document.createElement('button');
        buttonElement.classList.add("exp__controller__absolute__page");

        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute("class", "fillable-circle");
        svgElement.setAttribute("viewBox", "0 0 15 15");
        buttonElement.appendChild(svgElement);

        const circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleElement.setAttribute("cx", "7.5");
        circleElement.setAttribute("cy", "7.5");
        circleElement.setAttribute("r", "6.5");
        circleElement.setAttribute("stroke-width", "2");
        svgElement.appendChild(circleElement);

        return buttonElement;
    }

    #listenForClickOnAbsoluteButtonElement(element, referencedPageNumber) {
        const clickEventListener = () => {
            this.toPage(referencedPageNumber);
        }
        element.addEventListener("click", clickEventListener);

        this.addFreeAction(() => {
            element.removeEventListener("click", clickEventListener);
        });
    }
}

class ExperienceCarousel extends ControlledCarousel {
    /**
     * 
     * @param {HTMLElement} contentElement 
     * @param {HTMLElement} controllerElement 
     */
    constructor(contentElement, controllerElement) {
        super(contentElement, controllerElement);

        this.#listenForClickOnEveryItem();
    }

    #listenForClickOnEveryItem() {
        const experienceExpandedClassName = "experience--expanded";
        this.itemElements.forEach((element) => {
            const clickEventListener = () => {
                const container = this.parentElement;

                // Remove all other expanded modifiers
                container.querySelectorAll(`.${experienceExpandedClassName}`).forEach((expandedElement) => {
                    if (expandedElement === element) return;

                    expandedElement.classList.remove(experienceExpandedClassName);
                });

                element.classList.toggle(experienceExpandedClassName);
                container.scrollTo(element.offsetLeft, 0);
            }
            element.addEventListener("click", clickEventListener);

            this.addFreeAction(() => {
                element.removeEventListener("click", clickEventListener);
            })
        });
    }
}


const carousel = new ExperienceCarousel(
    document.querySelector(".exp__content"),
    document.querySelector(".exp__controller")
);
