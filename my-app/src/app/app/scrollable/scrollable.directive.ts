import { Directive, HostListener, EventEmitter, Output, ElementRef } from '@angular/core';

@Directive({
  selector: '[scrollable]'
})
export class ScrollableDirective {

  @Output() scrollPosition = new EventEmitter()

  constructor(public el: ElementRef) {
    el.nativeElement.style.backgroundColor = 'yellow';
    console.log(el);
  }

  @HostListener('scroll', ['$event'])
  ngOnInit() {
    window.addEventListener('scroll', this.onScroll, true);
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll, true);
  }
  onScroll(event) {
    console.log("a thing")
    console.log(this.el);
    console.log(event)
    /*const top = event.target.scrollTop
    const height = this.el.nativeElement.scrollHeight
    const offset = this.el.nativeElement.offsetHeight
    console.log("top: " + top);
    console.log("height: " + height);
    console.log("offset: " + offset);
    // emit bottom event
    if (top > height - offset - 1) {
      this.scrollPosition.emit('bottom')
    }

    // emit top event
    if (top === 0) {
      this.scrollPosition.emit('top')
    }*/
  }
}
