// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { every } from '@lumino/algorithm';
import { Message } from '@lumino/messaging';
import { AccordionLayout, Title, Widget } from '@lumino/widgets';
import { expect } from 'chai';

const renderer: AccordionLayout.IRenderer = {
  titleClassName: '.lm-AccordionTitle',
  createHandle: () => document.createElement('div'),
  createSectionTitle: (title: Title<Widget>) => document.createElement('h3')
};

class LogAccordionLayout extends AccordionLayout {
  methods: string[] = [];

  protected init(): void {
    super.init();
    this.methods.push('init');
  }

  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget);
    this.methods.push('attachWidget');
  }

  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget);
    this.methods.push('moveWidget');
  }

  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget);
    this.methods.push('detachWidget');
  }

  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg);
    this.methods.push('onFitRequest');
  }
}

describe('@lumino/widgets', () => {
  describe('AccordionLayout', () => {
    describe('#constructor()', () => {
      it('should accept a renderer', () => {
        const layout = new AccordionLayout({ renderer });
        expect(layout).to.be.an.instanceof(AccordionLayout);
      });

      it('should be vertical by default', () => {
        const layout = new AccordionLayout({ renderer });
        expect(layout.orientation).to.equal('vertical');
      });
    });

    describe('#titleSpace', () => {
      it('should get the inter-element spacing for the split layout', () => {
        const layout = new AccordionLayout({ renderer });
        expect(layout.titleSpace).to.equal(22);
      });

      it('should set the inter-element spacing for the split layout', () => {
        const layout = new AccordionLayout({ renderer });
        layout.titleSpace = 10;
        expect(layout.titleSpace).to.equal(10);
      });

      it('should post a fit request to the parent widget', done => {
        let layout = new LogAccordionLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.titleSpace = 10;
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', done => {
        let layout = new LogAccordionLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.titleSpace = 22;
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });
    });

    describe('#renderer', () => {
      it('should get the renderer for the layout', () => {
        const layout = new AccordionLayout({ renderer });
        expect(layout.renderer).to.equal(renderer);
      });
    });

    describe('#titles', () => {
      it('should be a read-only sequence of the accordion titles in the layout', () => {
        const layout = new AccordionLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        const widgets = [new Widget(), new Widget(), new Widget()];
        for (const widget of widgets) {
          layout.addWidget(widget);
        }

        expect(every(layout.titles, h => h instanceof HTMLElement));
        expect(layout.titles).to.have.length(widgets.length);
      });
    });

    describe('#attachWidget()', () => {
      it('should insert a title node before the widget', () => {
        let layout = new LogAccordionLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        let widget = new Widget();

        layout.addWidget(widget);

        expect(layout.methods).to.contain('attachWidget');
        expect(parent.node.contains(widget.node)).to.equal(true);
        expect(layout.titles.length).to.equal(1);

        const title = layout.titles[0];
        expect(widget.node.previousElementSibling).to.equal(title);
        expect(title.getAttribute('aria-label')).to.equal(
          `${parent.title.label} Section`
        );
        expect(title.getAttribute('aria-expanded')).to.equal('true');
        expect(title.classList.contains('lm-mod-expanded')).to.be.true;

        expect(widget.node.getAttribute('role')).to.equal('region');
        expect(widget.node.getAttribute('aria-labelledby')).to.equal(title.id);
        parent.dispose();
      });
    });

    describe('#moveWidget()', () => {
      it("should move a title in the parent's DOM node", () => {
        let layout = new LogAccordionLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        let widget = widgets[0];
        let title = layout.titles[0];

        layout.insertWidget(2, widget);

        expect(layout.methods).to.contain('moveWidget');
        expect(layout.titles[2]).to.equal(title);
        parent.dispose();
      });
    });

    describe('#detachWidget()', () => {
      it("should detach a title from the parent's DOM node", () => {
        let layout = new LogAccordionLayout({ renderer });
        let widget = new Widget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        const title = layout.titles[0];

        layout.removeWidget(widget);

        expect(layout.methods).to.contain('detachWidget');
        expect(parent.node.contains(title)).to.equal(false);
        expect(layout.titles).to.have.length(0);
        parent.dispose();
      });
    });

    describe('#dispose', () => {
      it('clear the titles list', () => {
        const layout = new AccordionLayout({ renderer });
        const widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });

        layout.dispose();

        expect(layout.titles).to.have.length(0);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { every } from '@lumino/algorithm';
import { MessageLoop } from '@lumino/messaging';
import {
  AccordionLayout,
  AccordionPanel,
  Title,
  Widget
} from '@lumino/widgets';
import { expect } from 'chai';

const bubbles = true;
const renderer: AccordionPanel.IRenderer = {
  titleClassName: '.lm-AccordionTitle',
  createHandle: () => document.createElement('div'),
  createSectionTitle: (title: Title<Widget>) => document.createElement('h3')
};

class LogAccordionPanel extends AccordionPanel {
  events: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }
}

describe('@lumino/widgets', () => {
  describe('AccordionPanel', () => {
    describe('#constructor()', () => {
      it('should accept no arguments', () => {
        let panel = new AccordionPanel();
        expect(panel).to.be.an.instanceof(AccordionPanel);
      });

      it('should accept options', () => {
        let panel = new AccordionPanel({
          orientation: 'horizontal',
          spacing: 5,
          titleSpace: 42,
          renderer
        });
        expect(panel.orientation).to.equal('horizontal');
        expect(panel.spacing).to.equal(5);
        expect(panel.titleSpace).to.equal(42);
        expect(panel.renderer).to.equal(renderer);
      });

      it('should accept a layout option', () => {
        let layout = new AccordionLayout({ renderer });
        let panel = new AccordionPanel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should ignore other options if a layout is given', () => {
        let ignored = Object.create(renderer);
        let layout = new AccordionLayout({ renderer });
        let panel = new AccordionPanel({
          layout,
          orientation: 'horizontal',
          spacing: 5,
          titleSpace: 42,
          renderer: ignored
        });
        expect(panel.layout).to.equal(layout);
        expect(panel.orientation).to.equal('vertical');
        expect(panel.spacing).to.equal(4);
        expect(panel.titleSpace).to.equal(22);
        expect(panel.renderer).to.equal(renderer);
      });

      it('should add the `lm-AccordionPanel` class', () => {
        let panel = new AccordionPanel();
        expect(panel.hasClass('lm-AccordionPanel')).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the panel', () => {
        let panel = new LogAccordionPanel();
        let layout = panel.layout as AccordionLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        Widget.attach(panel, document.body);

        panel.dispose();

        expect(every(widgets, w => w.isDisposed));
        expect(layout.titles).to.have.length(0);
      });
    });

    describe('#titleSpace', () => {
      it('should default to `22`', () => {
        let panel = new AccordionPanel();
        expect(panel.titleSpace).to.equal(22);
      });

      it('should set the titleSpace for the panel', () => {
        let panel = new AccordionPanel();
        panel.titleSpace = 10;
        expect(panel.titleSpace).to.equal(10);
      });
    });

    describe('#renderer', () => {
      it('should get the renderer for the panel', () => {
        let panel = new AccordionPanel({ renderer });
        expect(panel.renderer).to.equal(renderer);
      });
    });

    describe('#titles', () => {
      it('should get the read-only sequence of the accordion titles in the panel', () => {
        let panel = new AccordionPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        expect(panel.titles.length).to.equal(widgets.length);
      });

      it('should update the title element', () => {
        const text = 'Something';
        let panel = new AccordionPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.title.label = text;
        const el = panel.titles[0].querySelector(
          '.lm-AccordionPanel-titleLabel'
        )!;
        expect(el.textContent).to.equal(text);
      });
    });

    describe('#collapse()', () => {
      let panel: AccordionPanel;
      let layout: AccordionLayout;

      beforeEach(() => {
        panel = new AccordionPanel();
        layout = panel.layout as AccordionLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.setRelativeSizes([10, 10, 10, 20]);
        Widget.attach(panel, document.body);
        MessageLoop.flush();
      });

      afterEach(() => {
        panel.dispose();
      });

      it('should collapse an expanded widget', () => {
        panel.collapse(1);

        expect(layout.titles[1].getAttribute('aria-expanded')).to.equal(
          'false'
        );
        expect(layout.titles[1].classList.contains('lm-mod-expanded')).to.be
          .false;
        expect(layout.widgets[1].isHidden).to.be.true;
      });
    });

    describe('#expand()', () => {
      let panel: AccordionPanel;
      let layout: AccordionLayout;

      beforeEach(() => {
        panel = new AccordionPanel();
        layout = panel.layout as AccordionLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.setRelativeSizes([10, 10, 10, 20]);
        Widget.attach(panel, document.body);
        MessageLoop.flush();
      });

      afterEach(() => {
        panel.dispose();
      });

      it('should expand a collapsed widget', () => {
        panel.collapse(1);
        panel.expand(1);

        expect(layout.titles[0].getAttribute('aria-expanded')).to.equal('true');
        expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
          .true;
        expect(layout.widgets[0].isHidden).to.be.false;
      });
    });

    describe('#handleEvent()', () => {
      let panel: LogAccordionPanel;
      let layout: AccordionLayout;

      beforeEach(() => {
        panel = new LogAccordionPanel();
        layout = panel.layout as AccordionLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.setRelativeSizes([10, 10, 10, 20]);
        Widget.attach(panel, document.body);
        MessageLoop.flush();
      });

      afterEach(() => {
        panel.dispose();
      });

      context('click', () => {
        it('should collapse an expanded widget', () => {
          layout.titles[0].dispatchEvent(new MouseEvent('click', { bubbles }));
          expect(panel.events).to.contain('click');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'false'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .false;
          expect(layout.widgets[0].isHidden).to.be.true;
        });

        it('should expand a collapsed widget', () => {
          // Collapse.
          layout.titles[0].dispatchEvent(new MouseEvent('click', { bubbles }));
          // Expand.
          layout.titles[0].dispatchEvent(new MouseEvent('click', { bubbles }));

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'true'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .true;
          expect(layout.widgets[0].isHidden).to.be.false;
        });
      });

      context('keydown', () => {
        it('should redirect to toggle expansion state if Space is pressed', () => {
          layout.titles[0].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              key: 'Space'
            })
          );
          expect(panel.events).to.contain('keydown');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'false'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .false;
          expect(layout.widgets[0].isHidden).to.be.true;

          layout.titles[0].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              key: 'Space'
            })
          );
          expect(panel.events).to.contain('keydown');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'true'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .true;
          expect(layout.widgets[0].isHidden).to.be.false;
        });

        it('should redirect to toggle expansion state if Enter is pressed', () => {
          layout.titles[0].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              key: 'Enter'
            })
          );
          expect(panel.events).to.contain('keydown');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'false'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .false;
          expect(layout.widgets[0].isHidden).to.be.true;

          layout.titles[0].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              key: 'Enter'
            })
          );
          expect(panel.events).to.contain('keydown');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'true'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .true;
          expect(layout.widgets[0].isHidden).to.be.false;
        });

        it('should focus on the next widget if Arrow Down is pressed', () => {
          layout.titles[1].focus();
          layout.titles[1].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              key: 'ArrowDown'
            })
          );
          expect(panel.events).to.contain('keydown');

          expect(document.activeElement).to.be.equal(layout.titles[2]);
        });

        it('should focus on the previous widget if Arrow Up is pressed', () => {
          layout.titles[1].focus();
          layout.titles[1].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              key: 'ArrowUp'
            })
          );
          expect(panel.events).to.contain('keydown');

          expect(document.activeElement).to.be.equal(layout.titles[0]);
        });

        it('should focus on the first widget if Home is pressed', () => {
          layout.titles[1].focus();
          layout.titles[1].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              key: 'Home'
            })
          );
          expect(panel.events).to.contain('keydown');

          expect(document.activeElement).to.be.equal(layout.titles[0]);
        });

        it('should focus on the last widget if End is pressed', () => {
          layout.titles[1].focus();
          layout.titles[1].dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              key: 'End'
            })
          );
          expect(panel.events).to.contain('keydown');

          expect(document.activeElement).to.be.equal(layout.titles[2]);
        });
      });
    });

    describe('#onBeforeAttach()', () => {
      it('should attach a click listener to the node', () => {
        let panel = new LogAccordionPanel();
        Widget.attach(panel, document.body);
        panel.node.dispatchEvent(new MouseEvent('click', { bubbles }));
        expect(panel.events).to.contain('click');
        panel.dispose();
      });

      it('should attach a keydown listener to the node', () => {
        let panel = new LogAccordionPanel();
        Widget.attach(panel, document.body);
        panel.node.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
        expect(panel.events).to.contain('keydown');
        panel.dispose();
      });
    });

    describe('#onAfterDetach()', () => {
      it('should remove click listener', () => {
        let panel = new LogAccordionPanel();
        Widget.attach(panel, document.body);
        panel.node.dispatchEvent(new MouseEvent('click', { bubbles }));
        expect(panel.events).to.contain('click');

        Widget.detach(panel);

        panel.events = [];
        panel.node.dispatchEvent(new MouseEvent('click', { bubbles }));
        expect(panel.events).to.not.contain('click');
      });

      it('should remove keydown listener', () => {
        let panel = new LogAccordionPanel();
        Widget.attach(panel, document.body);
        panel.node.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
        expect(panel.events).to.contain('keydown');

        Widget.detach(panel);

        panel.events = [];
        panel.node.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
        expect(panel.events).to.not.contain('keydown');
      });
    });

    describe('.Renderer()', () => {
      describe('.defaultRenderer', () => {
        it('should be an instance of `Renderer`', () => {
          expect(AccordionPanel.defaultRenderer).to.be.an.instanceof(
            AccordionPanel.Renderer
          );
        });
      });

      describe('#constructor', () => {
        it('should create a section title', () => {
          const renderer = new AccordionPanel.Renderer();

          expect(
            renderer.createSectionTitle(
              new Title<Widget>({ owner: new Widget() })
            )
          ).to.be.instanceOf(HTMLElement);
        });

        it('should have a section title selector', () => {
          const renderer = new AccordionPanel.Renderer();

          expect(renderer.titleClassName).to.be.equal(
            'lm-AccordionPanel-title'
          );
        });
      });
    });

    describe('#_computeWidgetSize()', () => {
      const DELTA = 1e-6;
      let panel: AccordionPanel;
      beforeEach(() => {
        panel = new AccordionPanel({ renderer, titleSpace: 0, spacing: 0 });
        panel.node.style.height = '500px';
        Widget.attach(panel, document.body);
      });
      it('should not compute the size of panel with only one widget', () => {
        panel.addWidget(new Widget());
        MessageLoop.flush();
        const value = panel['_computeWidgetSize'](0);
        expect(value).to.be.equal(undefined);
      });
      it('should compute the size of panel with two opened widgets', () => {
        const widgets = [new Widget(), new Widget()];
        widgets.forEach(w => panel.addWidget(w));
        MessageLoop.flush();
        const value0 = panel['_computeWidgetSize'](0);
        expect(value0.length).to.be.equal(2);
        expect(value0[0]).to.be.closeTo(0, DELTA);
        expect(value0[1]).to.be.closeTo(1, DELTA);
        const value1 = panel['_computeWidgetSize'](1);
        expect(value1[0]).to.be.closeTo(1, DELTA);
        expect(value1[1]).to.be.closeTo(0, DELTA);
      });
      it('should compute the size of panel with three widgets', () => {
        const widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => panel.addWidget(w));
        MessageLoop.flush();

        const value = panel['_computeWidgetSize'](0);
        expect(value.length).to.be.equal(3);
        expect(value[0]).to.be.closeTo(0, DELTA);
        expect(value[1]).to.be.closeTo(0.333333, DELTA);
        expect(value[2]).to.be.closeTo(0.666666, DELTA);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { BoxEngine, BoxSizer } from '@lumino/widgets';

function createSizers(n: number): BoxSizer[] {
  let sizers: BoxSizer[] = [];
  for (let i = 0; i < n; ++i) {
    sizers.push(new BoxSizer());
  }
  return sizers;
}

describe('@lumino/widgets', () => {
  describe('BoxSizer', () => {
    describe('#constructor()', () => {
      it('should accept no arguments', () => {
        let sizer = new BoxSizer();
        expect(sizer).to.be.an.instanceof(BoxSizer);
      });
    });

    describe('#sizeHint', () => {
      it('should default to `0`', () => {
        let sizer = new BoxSizer();
        expect(sizer.sizeHint).to.equal(0);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.sizeHint = 42;
        expect(sizer.sizeHint).to.equal(42);
      });
    });

    describe('#minSize', () => {
      it('should default to `0`', () => {
        let sizer = new BoxSizer();
        expect(sizer.minSize).to.equal(0);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.minSize = 42;
        expect(sizer.minSize).to.equal(42);
      });
    });

    describe('#maxSize', () => {
      it('should default to `Infinity`', () => {
        let sizer = new BoxSizer();
        expect(sizer.maxSize).to.equal(Infinity);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.maxSize = 42;
        expect(sizer.maxSize).to.equal(42);
      });
    });

    describe('#stretch', () => {
      it('should default to `1`', () => {
        let sizer = new BoxSizer();
        expect(sizer.stretch).to.equal(1);
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.stretch = 42;
        expect(sizer.stretch).to.equal(42);
      });
    });

    describe('#size', () => {
      it('should be the computed output', () => {
        let sizer = new BoxSizer();
        expect(typeof sizer.size).to.equal('number');
      });

      it('should be writable', () => {
        let sizer = new BoxSizer();
        sizer.size = 42;
        expect(sizer.size).to.equal(42);
      });
    });
  });

  describe('BoxEngine', () => {
    describe('calc()', () => {
      it('should handle an empty sizers array', () => {
        expect(() => BoxEngine.calc([], 100)).to.not.throw(Error);
      });

      it('should obey the min sizes', () => {
        let sizers = createSizers(4);
        sizers[0].minSize = 10;
        sizers[1].minSize = 20;
        sizers[2].minSize = 30;
        sizers[3].minSize = 40;
        BoxEngine.calc(sizers, 0);
        expect(sizers[0].size).to.equal(10);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(30);
        expect(sizers[3].size).to.equal(40);
      });

      it('should obey the max sizes', () => {
        let sizers = createSizers(4);
        sizers[0].maxSize = 10;
        sizers[1].maxSize = 20;
        sizers[2].maxSize = 30;
        sizers[3].maxSize = 40;
        BoxEngine.calc(sizers, 500);
        expect(sizers[0].size).to.equal(10);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(30);
        expect(sizers[3].size).to.equal(40);
      });

      it('should handle negative layout space', () => {
        let sizers = createSizers(4);
        sizers[0].minSize = 10;
        sizers[1].minSize = 20;
        sizers[2].minSize = 30;
        BoxEngine.calc(sizers, -500);
        expect(sizers[0].size).to.equal(10);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(30);
        expect(sizers[3].size).to.equal(0);
      });

      it('should handle infinite layout space', () => {
        let sizers = createSizers(4);
        sizers[0].maxSize = 10;
        sizers[1].maxSize = 20;
        sizers[2].maxSize = 30;
        BoxEngine.calc(sizers, Infinity);
        expect(sizers[0].size).to.equal(10);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(30);
        expect(sizers[3].size).to.equal(Infinity);
      });

      it('should maintain the size hints if possible', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 40;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 70;
        BoxEngine.calc(sizers, 220);
        expect(sizers[0].size).to.equal(40);
        expect(sizers[1].size).to.equal(50);
        expect(sizers[2].size).to.equal(60);
        expect(sizers[3].size).to.equal(70);
      });

      it('should fairly distribute negative space', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 40;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 70;
        BoxEngine.calc(sizers, 200);
        expect(sizers[0].size).to.equal(35);
        expect(sizers[1].size).to.equal(45);
        expect(sizers[2].size).to.equal(55);
        expect(sizers[3].size).to.equal(65);
      });

      it('should fairly distribute positive space', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 40;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 70;
        BoxEngine.calc(sizers, 240);
        expect(sizers[0].size).to.equal(45);
        expect(sizers[1].size).to.equal(55);
        expect(sizers[2].size).to.equal(65);
        expect(sizers[3].size).to.equal(75);
      });

      it('should be callable multiple times for the same sizers', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 40;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 70;
        BoxEngine.calc(sizers, 240);
        expect(sizers[0].size).to.equal(45);
        expect(sizers[1].size).to.equal(55);
        expect(sizers[2].size).to.equal(65);
        expect(sizers[3].size).to.equal(75);
        BoxEngine.calc(sizers, 280);
        expect(sizers[0].size).to.equal(55);
        expect(sizers[1].size).to.equal(65);
        expect(sizers[2].size).to.equal(75);
        expect(sizers[3].size).to.equal(85);
        BoxEngine.calc(sizers, 200);
        expect(sizers[0].size).to.equal(35);
        expect(sizers[1].size).to.equal(45);
        expect(sizers[2].size).to.equal(55);
        expect(sizers[3].size).to.equal(65);
      });

      it('should distribute negative space according to stretch factors', () => {
        let sizers = createSizers(2);
        sizers[0].sizeHint = 60;
        sizers[1].sizeHint = 60;
        sizers[0].stretch = 2;
        sizers[1].stretch = 4;
        BoxEngine.calc(sizers, 120);
        expect(sizers[0].size).to.equal(60);
        expect(sizers[1].size).to.equal(60);
        BoxEngine.calc(sizers, 60);
        expect(sizers[0].size).to.equal(40);
        expect(sizers[1].size).to.equal(20);
      });

      it('should distribute positive space according to stretch factors', () => {
        let sizers = createSizers(2);
        sizers[0].sizeHint = 60;
        sizers[1].sizeHint = 60;
        sizers[0].stretch = 2;
        sizers[1].stretch = 4;
        BoxEngine.calc(sizers, 120);
        expect(sizers[0].size).to.equal(60);
        expect(sizers[1].size).to.equal(60);
        BoxEngine.calc(sizers, 240);
        expect(sizers[0].size).to.equal(100);
        expect(sizers[1].size).to.equal(140);
      });

      it('should not shrink non-stretchable sizers', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 20;
        sizers[1].sizeHint = 40;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 80;
        sizers[0].stretch = 0;
        sizers[2].stretch = 0;
        BoxEngine.calc(sizers, 160);
        expect(sizers[0].size).to.equal(20);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(60);
        expect(sizers[3].size).to.equal(60);
      });

      it('should not expand non-stretchable sizers', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 20;
        sizers[1].sizeHint = 40;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 80;
        sizers[0].stretch = 0;
        sizers[2].stretch = 0;
        BoxEngine.calc(sizers, 260);
        expect(sizers[0].size).to.equal(20);
        expect(sizers[1].size).to.equal(70);
        expect(sizers[2].size).to.equal(60);
        expect(sizers[3].size).to.equal(110);
      });

      it('should shrink non-stretchable sizers if required', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 20;
        sizers[1].sizeHint = 40;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 80;
        sizers[0].stretch = 0;
        sizers[2].stretch = 0;
        sizers[1].minSize = 20;
        sizers[2].minSize = 55;
        sizers[3].minSize = 60;
        BoxEngine.calc(sizers, 140);
        expect(sizers[0].size).to.equal(5);
        expect(sizers[1].size).to.equal(20);
        expect(sizers[2].size).to.equal(55);
        expect(sizers[3].size).to.equal(60);
      });

      it('should expand non-stretchable sizers if required', () => {
        let sizers = createSizers(4);
        sizers[0].sizeHint = 20;
        sizers[1].sizeHint = 40;
        sizers[2].sizeHint = 60;
        sizers[3].sizeHint = 80;
        sizers[0].stretch = 0;
        sizers[2].stretch = 0;
        sizers[1].maxSize = 60;
        sizers[2].maxSize = 70;
        sizers[3].maxSize = 100;
        BoxEngine.calc(sizers, 280);
        expect(sizers[0].size).to.equal(50);
        expect(sizers[1].size).to.equal(60);
        expect(sizers[2].size).to.equal(70);
        expect(sizers[3].size).to.equal(100);
      });
    });

    describe('adjust()', () => {
      it('should adjust a sizer by a positive delta', () => {
        let sizers = createSizers(5);
        sizers[0].sizeHint = 50;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 50;
        sizers[3].sizeHint = 50;
        sizers[4].sizeHint = 50;
        sizers[2].maxSize = 60;
        sizers[3].minSize = 40;
        BoxEngine.calc(sizers, 250);
        expect(sizers[0].size).to.equal(50);
        expect(sizers[1].size).to.equal(50);
        expect(sizers[2].size).to.equal(50);
        expect(sizers[3].size).to.equal(50);
        expect(sizers[3].size).to.equal(50);
        BoxEngine.adjust(sizers, 2, 30);
        expect(sizers[0].sizeHint).to.equal(50);
        expect(sizers[1].sizeHint).to.equal(70);
        expect(sizers[2].sizeHint).to.equal(60);
        expect(sizers[3].sizeHint).to.equal(40);
        expect(sizers[4].sizeHint).to.equal(30);
      });

      it('should adjust a sizer by a negative delta', () => {
        let sizers = createSizers(5);
        sizers[0].sizeHint = 50;
        sizers[1].sizeHint = 50;
        sizers[2].sizeHint = 50;
        sizers[3].sizeHint = 50;
        sizers[4].sizeHint = 50;
        sizers[1].minSize = 40;
        sizers[2].minSize = 40;
        BoxEngine.calc(sizers, 250);
        expect(sizers[0].size).to.equal(50);
        expect(sizers[1].size).to.equal(50);
        expect(sizers[2].size).to.equal(50);
        expect(sizers[3].size).to.equal(50);
        expect(sizers[3].size).to.equal(50);
        BoxEngine.adjust(sizers, 2, -30);
        expect(sizers[0].sizeHint).to.equal(40);
        expect(sizers[1].sizeHint).to.equal(40);
        expect(sizers[2].sizeHint).to.equal(40);
        expect(sizers[3].sizeHint).to.equal(80);
        expect(sizers[4].sizeHint).to.equal(50);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { every } from '@lumino/algorithm';

import { Message, MessageLoop } from '@lumino/messaging';

import { BoxLayout, Widget } from '@lumino/widgets';

class LogBoxLayout extends BoxLayout {
  methods: string[] = [];

  protected init(): void {
    super.init();
    this.methods.push('init');
  }

  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget);
    this.methods.push('attachWidget');
  }

  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget);
    this.methods.push('moveWidget');
  }

  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget);
    this.methods.push('detachWidget');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg);
    this.methods.push('onChildShown');
  }

  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg);
    this.methods.push('onChildHidden');
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.methods.push('onResize');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg);
    this.methods.push('onFitRequest');
  }
}

class LogWidget extends Widget {
  methods: string[] = [];

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }
}

describe('@lumino/widgets', () => {
  describe('BoxLayout', () => {
    describe('constructor()', () => {
      it('should take no arguments', () => {
        let layout = new BoxLayout();
        expect(layout).to.be.an.instanceof(BoxLayout);
      });

      it('should accept options', () => {
        let layout = new BoxLayout({ direction: 'bottom-to-top', spacing: 10 });
        expect(layout.direction).to.equal('bottom-to-top');
        expect(layout.spacing).to.equal(10);
      });
    });

    describe('#direction', () => {
      it('should default to `"top-to-bottom"`', () => {
        let layout = new BoxLayout();
        expect(layout.direction).to.equal('top-to-bottom');
      });

      it('should set the layout direction for the box layout', () => {
        let layout = new BoxLayout();
        layout.direction = 'left-to-right';
        expect(layout.direction).to.equal('left-to-right');
      });

      it('should set the direction attribute of the parent widget', () => {
        let parent = new Widget();
        let layout = new BoxLayout();
        parent.layout = layout;
        layout.direction = 'top-to-bottom';
        expect(parent.node.getAttribute('data-direction')).to.equal(
          'top-to-bottom'
        );
        layout.direction = 'bottom-to-top';
        expect(parent.node.getAttribute('data-direction')).to.equal(
          'bottom-to-top'
        );
        layout.direction = 'left-to-right';
        expect(parent.node.getAttribute('data-direction')).to.equal(
          'left-to-right'
        );
        layout.direction = 'right-to-left';
        expect(parent.node.getAttribute('data-direction')).to.equal(
          'right-to-left'
        );
      });

      it('should post a fit request to the parent widget', done => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.direction = 'right-to-left';
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', done => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.direction = 'top-to-bottom';
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });
    });

    describe('#spacing', () => {
      it('should default to `4`', () => {
        let layout = new BoxLayout();
        expect(layout.spacing).to.equal(4);
      });

      it('should set the inter-element spacing for the box panel', () => {
        let layout = new BoxLayout();
        layout.spacing = 8;
        expect(layout.spacing).to.equal(8);
      });

      it('should post a fit request to the parent widget', done => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.spacing = 8;
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', done => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.spacing = 4;
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });
    });

    describe('#init()', () => {
      it('should set the direction attribute on the parent widget', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        expect(parent.node.getAttribute('data-direction')).to.equal(
          'top-to-bottom'
        );
        expect(layout.methods).to.contain('init');
        parent.dispose();
      });

      it('should attach the child widgets', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        parent.layout = layout;
        expect(every(widgets, w => w.parent === parent));
        expect(layout.methods).to.contain('attachWidget');
        parent.dispose();
      });
    });

    describe('#attachWidget()', () => {
      it("should attach a widget to the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        layout.addWidget(widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(panel.node.contains(widget.node)).to.equal(true);
        panel.dispose();
      });

      it("should send an `'after-attach'` message if the parent is attached", () => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        let widget = new LogWidget();
        panel.layout = layout;
        Widget.attach(panel, document.body);
        layout.addWidget(widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(widget.methods).to.contain('onAfterAttach');
        panel.dispose();
      });

      it('should post a layout request for the parent widget', done => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        panel.layout = layout;
        layout.addWidget(new Widget());
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          panel.dispose();
          done();
        });
      });
    });

    describe('#moveWidget()', () => {
      it('should post an update request for the parent widget', done => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        panel.layout = layout;
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        layout.insertWidget(0, widget);
        expect(layout.methods).to.contain('moveWidget');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onUpdateRequest');
          panel.dispose();
          done();
        });
      });
    });

    describe('#detachWidget()', () => {
      it("should detach a widget from the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(panel.node.contains(widget.node)).to.equal(false);
        panel.dispose();
      });

      it("should send a `'before-detach'` message if the parent is attached", () => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        panel.layout = layout;
        let widget = new LogWidget();
        Widget.attach(panel, document.body);
        layout.addWidget(widget);
        layout.removeWidget(widget);
        expect(widget.methods).to.contain('onBeforeDetach');
        panel.dispose();
      });

      it('should post a layout request for the parent widget', done => {
        let panel = new Widget();
        let layout = new LogBoxLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          layout.removeWidget(widget);
          layout.methods = [];
          requestAnimationFrame(() => {
            expect(layout.methods).to.contain('onFitRequest');
            panel.dispose();
            done();
          });
        });
      });
    });

    describe('#onAfterShow()', () => {
      it('should post an update request to the parent', done => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        parent.hide();
        parent.show();
        expect(parent.methods).to.contain('onAfterShow');
        expect(layout.methods).to.contain('onAfterShow');
        requestAnimationFrame(() => {
          expect(parent.methods).to.contain('onUpdateRequest');
          parent.dispose();
          done();
        });
      });

      it('should send an `after-show` message to non-hidden child widgets', () => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        let hiddenWidgets = [new LogWidget(), new LogWidget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        hiddenWidgets.forEach(w => {
          layout.addWidget(w);
        });
        hiddenWidgets.forEach(w => {
          w.hide();
        });
        Widget.attach(parent, document.body);
        parent.layout = layout;
        parent.hide();
        parent.show();
        expect(every(widgets, w => w.methods.indexOf('after-show') !== -1));
        expect(
          every(hiddenWidgets, w => w.methods.indexOf('after-show') === -1)
        );
        expect(parent.methods).to.contain('onAfterShow');
        expect(layout.methods).to.contain('onAfterShow');
        parent.dispose();
      });
    });

    describe('#onAfterAttach()', () => {
      it('should post a fit request to the parent', done => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        expect(parent.methods).to.contain('onAfterAttach');
        expect(layout.methods).to.contain('onAfterAttach');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });

      it('should send `after-attach` to all child widgets', () => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        expect(parent.methods).to.contain('onAfterAttach');
        expect(layout.methods).to.contain('onAfterAttach');
        expect(every(widgets, w => w.methods.indexOf('onAfterAttach') !== -1));
        parent.dispose();
      });
    });

    describe('#onChildShown()', () => {
      it('should post or send a fit request to the parent', done => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        widgets[0].hide();
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        widgets[0].show();
        expect(layout.methods).to.contain('onChildShown');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onChildHidden()', () => {
      it('should post a fit request to the parent', done => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        widgets[0].hide();
        expect(layout.methods).to.contain('onChildHidden');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onResize()', () => {
      it('should be called when a resize event is sent to the parent', () => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
        parent.dispose();
      });

      it('should be a no-op if the parent is hidden', () => {
        let parent = new LogWidget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        parent.hide();
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
        parent.dispose();
      });
    });

    describe('#onUpdateRequest()', () => {
      it('should be called when the parent is updated', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest);
        expect(layout.methods).to.contain('onUpdateRequest');
      });
    });

    describe('#onFitRequest()', () => {
      it('should be called when the parent fit is requested', () => {
        let parent = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.FitRequest);
        expect(layout.methods).to.contain('onFitRequest');
      });
    });

    describe('.getStretch()', () => {
      it('should get the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(BoxLayout.getStretch(widget)).to.equal(0);
      });
    });

    describe('.setStretch()', () => {
      it('should set the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        BoxLayout.setStretch(widget, 8);
        expect(BoxLayout.getStretch(widget)).to.equal(8);
      });

      it("should post a fit request to the widget's parent", done => {
        let parent = new Widget();
        let widget = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.addWidget(widget);
        BoxLayout.setStretch(widget, 8);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });
    });

    describe('.getSizeBasis()', () => {
      it('should get the box panel size basis for the given widget', () => {
        let widget = new Widget();
        expect(BoxLayout.getSizeBasis(widget)).to.equal(0);
      });
    });

    describe('.setSizeBasis()', () => {
      it('should set the box panel size basis for the given widget', () => {
        let widget = new Widget();
        BoxLayout.setSizeBasis(widget, 8);
        expect(BoxLayout.getSizeBasis(widget)).to.equal(8);
      });

      it("should post a fit request to the widget's parent", done => {
        let parent = new Widget();
        let widget = new Widget();
        let layout = new LogBoxLayout();
        parent.layout = layout;
        layout.addWidget(widget);
        BoxLayout.setSizeBasis(widget, 8);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { BoxLayout, BoxPanel, Widget } from '@lumino/widgets';

describe('@lumino/widgets', () => {
  describe('BoxPanel', () => {
    describe('#constructor()', () => {
      it('should take no arguments', () => {
        let panel = new BoxPanel();
        expect(panel).to.be.an.instanceof(BoxPanel);
      });

      it('should accept options', () => {
        let panel = new BoxPanel({ direction: 'bottom-to-top', spacing: 10 });
        expect(panel.direction).to.equal('bottom-to-top');
        expect(panel.spacing).to.equal(10);
      });

      it('should accept a layout option', () => {
        let layout = new BoxLayout();
        let panel = new BoxPanel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should ignore other options if a layout is given', () => {
        let layout = new BoxLayout();
        let panel = new BoxPanel({
          layout,
          direction: 'bottom-to-top',
          spacing: 10
        });
        expect(panel.layout).to.equal(layout);
        expect(panel.direction).to.equal('top-to-bottom');
        expect(panel.spacing).to.equal(4);
      });

      it('should add the `lm-BoxPanel` class', () => {
        let panel = new BoxPanel();
        expect(panel.hasClass('lm-BoxPanel')).to.equal(true);
      });
    });

    describe('#direction', () => {
      it('should default to `"top-to-bottom"`', () => {
        let panel = new BoxPanel();
        expect(panel.direction).to.equal('top-to-bottom');
      });

      it('should set the layout direction for the box panel', () => {
        let panel = new BoxPanel();
        panel.direction = 'left-to-right';
        expect(panel.direction).to.equal('left-to-right');
      });
    });

    describe('#spacing', () => {
      it('should default to `4`', () => {
        let panel = new BoxPanel();
        expect(panel.spacing).to.equal(4);
      });

      it('should set the inter-element spacing for the box panel', () => {
        let panel = new BoxPanel();
        panel.spacing = 8;
        expect(panel.spacing).to.equal(8);
      });
    });

    describe('#onChildAdded()', () => {
      it('should add the child class to a child added to the panel', () => {
        let panel = new BoxPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(widget.hasClass('lm-BoxPanel-child')).to.equal(true);
      });
    });

    describe('#onChildRemoved()', () => {
      it('should remove the child class from a child removed from the panel', () => {
        let panel = new BoxPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(widget.hasClass('lm-BoxPanel-child')).to.equal(false);
      });
    });

    describe('.getStretch()', () => {
      it('should get the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(BoxPanel.getStretch(widget)).to.equal(0);
      });
    });

    describe('.setStretch()', () => {
      it('should set the box panel stretch factor for the given widget', () => {
        let widget = new Widget();
        BoxPanel.setStretch(widget, 8);
        expect(BoxPanel.getStretch(widget)).to.equal(8);
      });
    });

    describe('.getSizeBasis()', () => {
      it('should get the box panel size basis for the given widget', () => {
        let widget = new Widget();
        expect(BoxPanel.getSizeBasis(widget)).to.equal(0);
      });
    });

    describe('.setSizeBasis()', () => {
      it('should set the box panel size basis for the given widget', () => {
        let widget = new Widget();
        BoxPanel.setSizeBasis(widget, 8);
        expect(BoxPanel.getSizeBasis(widget)).to.equal(8);
      });
    });
  });
});
/* eslint-disable @typescript-eslint/no-empty-function */
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { CommandRegistry } from '@lumino/commands';

import { Platform } from '@lumino/domutils';

import { MessageLoop } from '@lumino/messaging';

import { h, VirtualDOM } from '@lumino/virtualdom';

import { CommandPalette, Widget } from '@lumino/widgets';

class LogPalette extends CommandPalette {
  events: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }
}

const bubbles = true;
const defaultOptions: CommandPalette.IItemOptions = {
  command: 'test',
  category: 'Test Category',
  args: { foo: 'bar' },
  rank: 42
};

describe('@lumino/widgets', () => {
  let commands: CommandRegistry;
  let palette: CommandPalette;

  beforeEach(() => {
    commands = new CommandRegistry();
    palette = new CommandPalette({ commands });
  });

  afterEach(() => {
    palette.dispose();
  });

  describe('CommandPalette', () => {
    describe('#constructor()', () => {
      it('should accept command palette instantiation options', () => {
        expect(palette).to.be.an.instanceof(CommandPalette);
        expect(palette.node.classList.contains('lm-CommandPalette')).to.equal(
          true
        );
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the command palette', () => {
        palette.addItem(defaultOptions);
        palette.dispose();
        expect(palette.items.length).to.equal(0);
        expect(palette.isDisposed).to.equal(true);
      });
    });

    describe('#commands', () => {
      it('should get the command registry for the command palette', () => {
        expect(palette.commands).to.equal(commands);
      });
    });

    describe('#renderer', () => {
      it('should default to the default renderer', () => {
        expect(palette.renderer).to.equal(CommandPalette.defaultRenderer);
      });
    });

    describe('#searchNode', () => {
      it('should return the search node of a command palette', () => {
        expect(
          palette.searchNode.classList.contains('lm-CommandPalette-search')
        ).to.equal(true);
      });
    });

    describe('#inputNode', () => {
      it('should return the input node of a command palette', () => {
        expect(
          palette.inputNode.classList.contains('lm-CommandPalette-input')
        ).to.equal(true);
      });
    });

    describe('#contentNode', () => {
      it('should return the content node of a command palette', () => {
        expect(
          palette.contentNode.classList.contains('lm-CommandPalette-content')
        ).to.equal(true);
      });
    });

    describe('#items', () => {
      it('should be a read-only array of the palette items', () => {
        expect(palette.items.length).to.equal(0);
        palette.addItem(defaultOptions);
        expect(palette.items.length).to.equal(1);
        expect(palette.items[0].command).to.equal('test');
      });
    });

    describe('#addItems()', () => {
      it('should add items to a command palette using options', () => {
        const item = {
          command: 'test2',
          category: 'Test Category',
          args: { foo: 'bar' },
          rank: 100
        };

        expect(palette.items.length).to.equal(0);
        palette.addItems([defaultOptions, item]);
        expect(palette.items.length).to.equal(2);
        expect(palette.items[0].command).to.equal('test');
        expect(palette.items[1].command).to.equal('test2');
      });
    });

    describe('#addItem()', () => {
      it('should add an item to a command palette using options', () => {
        expect(palette.items.length).to.equal(0);
        palette.addItem(defaultOptions);
        expect(palette.items.length).to.equal(1);
        expect(palette.items[0].command).to.equal('test');
      });

      context('CommandPalette.IItem', () => {
        describe('#command', () => {
          it('should return the command name of a command item', () => {
            let item = palette.addItem(defaultOptions);
            expect(item.command).to.equal('test');
          });
        });

        describe('#args', () => {
          it('should return the args of a command item', () => {
            let item = palette.addItem(defaultOptions);
            expect(item.args).to.deep.equal(defaultOptions.args);
          });

          it('should default to an empty object', () => {
            let item = palette.addItem({ command: 'test', category: 'test' });
            expect(item.args).to.deep.equal({});
          });
        });

        describe('#category', () => {
          it('should return the category of a command item', () => {
            let item = palette.addItem(defaultOptions);
            expect(item.category).to.equal(defaultOptions.category);
          });
        });

        describe('#rank', () => {
          it('should return the rank of a command item', () => {
            let item = palette.addItem(defaultOptions);
            expect(item.rank).to.deep.equal(defaultOptions.rank);
          });

          it('should default to `Infinity`', () => {
            let item = palette.addItem({ command: 'test', category: 'test' });
            expect(item.rank).to.equal(Infinity);
          });
        });

        describe('#label', () => {
          it('should return the label of a command item', () => {
            let label = 'test label';
            commands.addCommand('test', { execute: () => {}, label });
            let item = palette.addItem(defaultOptions);
            expect(item.label).to.equal(label);
          });
        });

        describe('#caption', () => {
          it('should return the caption of a command item', () => {
            let caption = 'test caption';
            commands.addCommand('test', { execute: () => {}, caption });
            let item = palette.addItem(defaultOptions);
            expect(item.caption).to.equal(caption);
          });
        });

        describe('#className', () => {
          it('should return the class name of a command item', () => {
            let className = 'testClass';
            commands.addCommand('test', { execute: () => {}, className });
            let item = palette.addItem(defaultOptions);
            expect(item.className).to.equal(className);
          });
        });

        describe('#isEnabled', () => {
          it('should return whether a command item is enabled', () => {
            let called = false;
            commands.addCommand('test', {
              execute: () => {},
              isEnabled: () => {
                called = true;
                return false;
              }
            });
            let item = palette.addItem(defaultOptions);
            expect(called).to.equal(false);
            expect(item.isEnabled).to.equal(false);
            expect(called).to.equal(true);
          });
        });

        describe('#isToggled', () => {
          it('should return whether a command item is toggled', () => {
            let called = false;
            commands.addCommand('test', {
              execute: () => {},
              isToggled: () => {
                called = true;
                return true;
              }
            });
            let item = palette.addItem(defaultOptions);
            expect(called).to.equal(false);
            expect(item.isToggled).to.equal(true);
            expect(called).to.equal(true);
          });
        });

        describe('#isVisible', () => {
          it('should return whether a command item is visible', () => {
            let called = false;
            commands.addCommand('test', {
              execute: () => {},
              isVisible: () => {
                called = true;
                return false;
              }
            });
            let item = palette.addItem(defaultOptions);
            expect(called).to.equal(false);
            expect(item.isVisible).to.equal(false);
            expect(called).to.equal(true);
          });
        });

        describe('#keyBinding', () => {
          it('should return the key binding of a command item', () => {
            commands.addKeyBinding({
              keys: ['Ctrl A'],
              selector: 'body',
              command: 'test',
              args: defaultOptions.args
            });
            let item = palette.addItem(defaultOptions);
            expect(item.keyBinding!.keys).to.deep.equal(['Ctrl A']);
          });
        });
      });
    });

    describe('#removeItem()', () => {
      it('should remove an item from a command palette by item', () => {
        expect(palette.items.length).to.equal(0);
        let item = palette.addItem(defaultOptions);
        expect(palette.items.length).to.equal(1);
        palette.removeItem(item);
        expect(palette.items.length).to.equal(0);
      });
    });

    describe('#removeItemAt()', () => {
      it('should remove an item from a command palette by index', () => {
        expect(palette.items.length).to.equal(0);
        palette.addItem(defaultOptions);
        expect(palette.items.length).to.equal(1);
        palette.removeItemAt(0);
        expect(palette.items.length).to.equal(0);
      });
    });

    describe('#clearItems()', () => {
      it('should remove all items from a command palette', () => {
        expect(palette.items.length).to.equal(0);
        palette.addItem({ command: 'test', category: 'one' });
        palette.addItem({ command: 'test', category: 'two' });
        expect(palette.items.length).to.equal(2);
        palette.clearItems();
        expect(palette.items.length).to.equal(0);
      });
    });

    describe('#refresh()', () => {
      it('should schedule a refresh of the search items', () => {
        commands.addCommand('test', { execute: () => {}, label: 'test' });
        palette.addItem(defaultOptions);

        MessageLoop.flush();

        let content = palette.contentNode;
        let itemClass = '.lm-CommandPalette-item';
        let items = () => content.querySelectorAll(itemClass);

        expect(items()).to.have.length(1);
        palette.inputNode.value = 'x';
        palette.refresh();
        MessageLoop.flush();
        expect(items()).to.have.length(0);
      });
    });

    describe('#handleEvent()', () => {
      it('should handle click, keydown, and input events', () => {
        let palette = new LogPalette({ commands });
        Widget.attach(palette, document.body);
        ['click', 'keydown', 'input'].forEach(type => {
          palette.node.dispatchEvent(new Event(type, { bubbles }));
          expect(palette.events).to.contain(type);
        });
        palette.dispose();
      });

      context('click', () => {
        it('should trigger a command when its item is clicked', () => {
          let called = false;
          commands.addCommand('test', { execute: () => (called = true) });

          palette.addItem(defaultOptions);
          Widget.attach(palette, document.body);
          MessageLoop.flush();

          let node = palette.contentNode.querySelector(
            '.lm-CommandPalette-item'
          )!;
          node.dispatchEvent(new MouseEvent('click', { bubbles }));
          expect(called).to.equal(true);
        });

        it('should ignore the event if it is not a left click', () => {
          let called = false;
          commands.addCommand('test', { execute: () => (called = true) });

          palette.addItem(defaultOptions);
          Widget.attach(palette, document.body);
          MessageLoop.flush();

          let node = palette.contentNode.querySelector(
            '.lm-CommandPalette-item'
          )!;
          node.dispatchEvent(new MouseEvent('click', { bubbles, button: 1 }));
          expect(called).to.equal(false);
        });
      });

      context('keydown', () => {
        it('should navigate down if down arrow is pressed', () => {
          commands.addCommand('test', { execute: () => {} });
          let content = palette.contentNode;

          palette.addItem(defaultOptions);
          Widget.attach(palette, document.body);
          MessageLoop.flush();

          let node = content.querySelector('.lm-mod-active');
          expect(node).to.equal(null);
          palette.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 40 // Down arrow
            })
          );
          MessageLoop.flush();
          node = content.querySelector('.lm-CommandPalette-item.lm-mod-active');
          expect(node).to.not.equal(null);
        });

        it('should navigate up if up arrow is pressed', () => {
          commands.addCommand('test', { execute: () => {} });
          let content = palette.contentNode;

          palette.addItem(defaultOptions);
          Widget.attach(palette, document.body);
          MessageLoop.flush();

          let node = content.querySelector('.lm-mod-active');
          expect(node).to.equal(null);
          palette.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 38 // Up arrow
            })
          );
          MessageLoop.flush();
          node = content.querySelector('.lm-CommandPalette-item.lm-mod-active');
          expect(node).to.not.equal(null);
        });

        it('should ignore if modifier keys are pressed', () => {
          let called = false;
          commands.addCommand('test', { execute: () => (called = true) });
          let content = palette.contentNode;

          palette.addItem(defaultOptions);
          Widget.attach(palette, document.body);
          MessageLoop.flush();

          let node = content.querySelector('.lm-mod-active');

          expect(node).to.equal(null);
          ['altKey', 'ctrlKey', 'shiftKey', 'metaKey'].forEach(key => {
            palette.node.dispatchEvent(
              new KeyboardEvent('keydown', {
                bubbles,
                [key]: true,
                keyCode: 38 // Up arrow
              })
            );
            node = content.querySelector(
              '.lm-CommandPalette-item.lm-mod-active'
            );
            expect(node).to.equal(null);
          });
          expect(called).to.be.false;
        });

        it('should trigger active item if enter is pressed', () => {
          let called = false;
          commands.addCommand('test', {
            execute: () => (called = true)
          });
          let content = palette.contentNode;

          palette.addItem(defaultOptions);
          Widget.attach(palette, document.body);
          MessageLoop.flush();

          expect(content.querySelector('.lm-mod-active')).to.equal(null);
          palette.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 40 // Down arrow
            })
          );
          palette.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 13 // Enter
            })
          );
          expect(called).to.equal(true);
        });
      });

      context('input', () => {
        it('should filter the list of visible items', () => {
          ['A', 'B', 'C', 'D', 'E'].forEach(name => {
            commands.addCommand(name, { execute: () => {}, label: name });
            palette.addItem({ command: name, category: 'test' });
          });

          Widget.attach(palette, document.body);
          MessageLoop.flush();

          let content = palette.contentNode;
          let itemClass = '.lm-CommandPalette-item';
          let items = () => content.querySelectorAll(itemClass);

          expect(items()).to.have.length(5);
          palette.inputNode.value = 'A';
          palette.refresh();
          MessageLoop.flush();
          expect(items()).to.have.length(1);
        });

        it('should filter by both text and category', () => {
          let categories = ['Z', 'Y'];
          let names = [
            ['A1', 'B2', 'C3', 'D4', 'E5'],
            ['F1', 'G2', 'H3', 'I4', 'J5']
          ];
          names.forEach((values, index) => {
            values.forEach(command => {
              palette.addItem({ command, category: categories[index] });
              commands.addCommand(command, {
                execute: () => {},
                label: command
              });
            });
          });

          Widget.attach(palette, document.body);
          MessageLoop.flush();

          let headers = () =>
            palette.node.querySelectorAll('.lm-CommandPalette-header');
          let items = () =>
            palette.node.querySelectorAll('.lm-CommandPalette-item');
          let input = (value: string) => {
            palette.inputNode.value = value;
            palette.refresh();
            MessageLoop.flush();
          };

          expect(items()).to.have.length(10);
          input(`${categories[1]}`); // Category match
          expect(items()).to.have.length(5);
          input(`${names[1][0]}`); // Label match
          expect(items()).to.have.length(1);
          input(`${categories[1]} B`); // No match
          expect(items()).to.have.length(0);
          input(`${categories[1]} I`); // Category and text match
          expect(items()).to.have.length(1);

          input('1'); // Multi-category match
          expect(headers()).to.have.length(2);
          expect(items()).to.have.length(2);
        });
      });
    });

    describe('.Renderer', () => {
      let renderer = new CommandPalette.Renderer();
      let item: CommandPalette.IItem = null!;
      let enabledFlag = true;
      let toggledFlag = false;

      beforeEach(() => {
        enabledFlag = true;
        toggledFlag = false;
        commands.addCommand('test', {
          label: 'Test Command',
          caption: 'A simple test command',
          className: 'testClass',
          isEnabled: () => enabledFlag,
          isToggled: () => toggledFlag,
          execute: () => {}
        });
        commands.addKeyBinding({
          command: 'test',
          keys: ['Ctrl A'],
          selector: 'body'
        });
        item = palette.addItem({
          command: 'test',
          category: 'Test Category'
        });
      });

      describe('#renderHeader()', () => {
        it('should render a header node for the palette', () => {
          let vNode = renderer.renderHeader({
            category: 'Test Category',
            indices: null
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-CommandPalette-header')).to.equal(
            true
          );
          expect(node.innerHTML).to.equal('Test Category');
        });

        it('should mark the matching indices', () => {
          let vNode = renderer.renderHeader({
            category: 'Test Category',
            indices: [1, 2, 6, 7, 8]
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-CommandPalette-header')).to.equal(
            true
          );
          expect(node.innerHTML).to.equal(
            'T<mark>es</mark>t C<mark>ate</mark>gory'
          );
        });
      });

      describe('#renderItem()', () => {
        it('should render an item node for the palette', () => {
          let vNode = renderer.renderItem({
            item,
            indices: null,
            active: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-CommandPalette-item')).to.equal(
            true
          );
          expect(node.classList.contains('lm-mod-disabled')).to.equal(false);
          expect(node.classList.contains('lm-mod-toggled')).to.equal(false);
          expect(node.classList.contains('lm-mod-active')).to.equal(false);
          expect(node.classList.contains('testClass')).to.equal(true);
          expect(node.getAttribute('data-command')).to.equal('test');
          expect(
            node.querySelector('.lm-CommandPalette-itemShortcut')
          ).to.not.equal(null);
          expect(
            node.querySelector('.lm-CommandPalette-itemLabel')
          ).to.not.equal(null);
          expect(
            node.querySelector('.lm-CommandPalette-itemCaption')
          ).to.not.equal(null);
        });

        it('should handle the disabled item state', () => {
          enabledFlag = false;
          let vNode = renderer.renderItem({
            item,
            indices: null,
            active: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-mod-disabled')).to.equal(true);
        });

        it('should handle the toggled item state', () => {
          toggledFlag = true;
          let vNode = renderer.renderItem({
            item,
            indices: null,
            active: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-mod-toggled')).to.equal(true);
        });

        it('should handle the active state', () => {
          let vNode = renderer.renderItem({
            item,
            indices: null,
            active: true
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-mod-active')).to.equal(true);
        });
      });

      describe('#renderEmptyMessage()', () => {
        it('should render an empty message node for the palette', () => {
          let vNode = renderer.renderEmptyMessage({ query: 'foo' });
          let node = VirtualDOM.realize(vNode);
          expect(
            node.classList.contains('lm-CommandPalette-emptyMessage')
          ).to.equal(true);
          expect(node.innerHTML).to.equal("No commands found that match 'foo'");
        });
      });

      describe('#renderItemShortcut()', () => {
        it('should render an item shortcut node', () => {
          let vNode = renderer.renderItemShortcut({
            item,
            indices: null,
            active: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(
            node.classList.contains('lm-CommandPalette-itemShortcut')
          ).to.equal(true);
          if (Platform.IS_MAC) {
            expect(node.innerHTML).to.equal('\u2303 A');
          } else {
            expect(node.innerHTML).to.equal('Ctrl+A');
          }
        });
      });

      describe('#renderItemLabel()', () => {
        it('should render an item label node', () => {
          let vNode = renderer.renderItemLabel({
            item,
            indices: [1, 2, 3],
            active: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(
            node.classList.contains('lm-CommandPalette-itemLabel')
          ).to.equal(true);
          expect(node.innerHTML).to.equal('T<mark>est</mark> Command');
        });
      });

      describe('#renderItemCaption()', () => {
        it('should render an item caption node', () => {
          let vNode = renderer.renderItemCaption({
            item,
            indices: null,
            active: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(
            node.classList.contains('lm-CommandPalette-itemCaption')
          ).to.equal(true);
          expect(node.innerHTML).to.equal('A simple test command');
        });
      });

      describe('#createItemClass()', () => {
        it('should create the full class name for the item node', () => {
          let name = renderer.createItemClass({
            item,
            indices: null,
            active: false
          });
          let expected = 'lm-CommandPalette-item testClass';
          expect(name).to.equal(expected);
        });

        it('should handle the boolean states', () => {
          enabledFlag = false;
          toggledFlag = true;
          let name = renderer.createItemClass({
            item,
            indices: null,
            active: true
          });
          let expected =
            'lm-CommandPalette-item lm-mod-disabled lm-mod-toggled lm-mod-active testClass';
          expect(name).to.equal(expected);
        });
      });

      describe('#createItemDataset()', () => {
        it('should create the item dataset', () => {
          let dataset = renderer.createItemDataset({
            item,
            indices: null,
            active: false
          });
          expect(dataset).to.deep.equal({ command: 'test' });
        });
      });

      describe('#formatHeader()', () => {
        it('should format unmatched header content', () => {
          let child1 = renderer.formatHeader({
            category: 'Test Category',
            indices: null
          });
          let child2 = renderer.formatHeader({
            category: 'Test Category',
            indices: []
          });
          expect(child1).to.equal('Test Category');
          expect(child2).to.equal('Test Category');
        });

        it('should format matched header content', () => {
          let child = renderer.formatHeader({
            category: 'Test Category',
            indices: [1, 2, 6, 7, 8]
          });
          let node = VirtualDOM.realize(h.div(child));
          expect(node.innerHTML).to.equal(
            'T<mark>es</mark>t C<mark>ate</mark>gory'
          );
        });
      });

      describe('#formatEmptyMessage()', () => {
        it('should format the empty message text', () => {
          let child = renderer.formatEmptyMessage({ query: 'foo' });
          expect(child).to.equal("No commands found that match 'foo'");
        });
      });

      describe('#formatItemShortcut()', () => {
        it('should format the item shortcut text', () => {
          let child = renderer.formatItemShortcut({
            item,
            indices: null,
            active: false
          });
          if (Platform.IS_MAC) {
            expect(child).to.equal('\u2303 A');
          } else {
            expect(child).to.equal('Ctrl+A');
          }
        });
      });

      describe('#formatItemLabel()', () => {
        it('should format unmatched label content', () => {
          let child1 = renderer.formatItemLabel({
            item,
            indices: null,
            active: false
          });
          let child2 = renderer.formatItemLabel({
            item,
            indices: [],
            active: false
          });
          expect(child1).to.equal('Test Command');
          expect(child2).to.equal('Test Command');
        });

        it('should format matched label content', () => {
          let child = renderer.formatItemLabel({
            item,
            indices: [1, 2, 3],
            active: false
          });
          let node = VirtualDOM.realize(h.div(child));
          expect(node.innerHTML).to.equal('T<mark>est</mark> Command');
        });
      });

      describe('#formatItemCaption()', () => {
        it('should format the item caption text', () => {
          let child = renderer.formatItemCaption({
            item,
            indices: null,
            active: false
          });
          expect(child).to.equal('A simple test command');
        });
      });
    });
  });
});
/* eslint-disable @typescript-eslint/no-empty-function */
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { CommandRegistry } from '@lumino/commands';

import { JSONObject } from '@lumino/coreutils';

import { ContextMenu } from '@lumino/widgets';

describe('@lumino/widgets', () => {
  let commands = new CommandRegistry();

  before(() => {
    commands.addCommand('test-1', {
      execute: (args: JSONObject) => {},
      label: 'Test 1 Label'
    });
    commands.addCommand('test-2', {
      execute: (args: JSONObject) => {},
      label: 'Test 2 Label'
    });
    commands.addCommand('test-3', {
      execute: (args: JSONObject) => {},
      label: 'Test 3 Label'
    });
    commands.addCommand('test-4', {
      execute: (args: JSONObject) => {},
      label: 'Test 4 Label'
    });
  });

  describe('ContextMenu', () => {
    describe('#open', () => {
      let menu: ContextMenu;
      const CLASSNAME = 'menu-1';

      function addItems(menu: ContextMenu) {
        menu.addItem({
          command: 'test-1',
          selector: `.${CLASSNAME}`,
          rank: 20
        });
        menu.addItem({
          command: 'test-2',
          selector: `.${CLASSNAME}`,
          rank: 10
        });
        menu.addItem({
          command: 'test-3',
          selector: `div.${CLASSNAME}`,
          rank: 30
        });
        menu.addItem({
          command: 'test-4',
          selector: '.menu-2',
          rank: 1
        });
        menu.addItem({
          command: 'test-5',
          selector: 'body',
          rank: 15
        });
      }

      afterEach(() => {
        menu && menu.menu.dispose();
      });

      it('should show items matching selector, grouped and ordered by selector and rank', () => {
        const target = document.createElement('div');
        target.className = CLASSNAME;
        document.body.appendChild(target);

        menu = new ContextMenu({ commands });
        addItems(menu);

        const bb = target.getBoundingClientRect() as DOMRect;

        menu.open({
          target,
          currentTarget: document.body,
          clientX: bb.x,
          clientY: bb.y
        } as any);

        expect(menu.menu.items).to.have.length(4);
        expect(menu.menu.items[0].command).to.equal('test-3');
        expect(menu.menu.items[1].command).to.equal('test-2');
        expect(menu.menu.items[2].command).to.equal('test-1');
        expect(menu.menu.items[3].command).to.equal('test-5');
      });

      it('should show items matching selector, grouped and ordered only by rank', () => {
        const target = document.createElement('div');
        target.className = CLASSNAME;
        document.body.appendChild(target);

        menu = new ContextMenu({ commands, sortBySelector: false });
        addItems(menu);

        const bb = target.getBoundingClientRect() as DOMRect;

        menu.open({
          target,
          currentTarget: document.body,
          clientX: bb.x,
          clientY: bb.y
        } as any);

        expect(menu.menu.items).to.have.length(4);
        expect(menu.menu.items[0].command).to.equal('test-2');
        expect(menu.menu.items[1].command).to.equal('test-1');
        expect(menu.menu.items[2].command).to.equal('test-3');
        expect(menu.menu.items[3].command).to.equal('test-5');
      });

      it('should show items matching selector, ungrouped and ordered by selector and rank', () => {
        const target = document.createElement('div');
        target.className = CLASSNAME;
        document.body.appendChild(target);

        menu = new ContextMenu({
          commands,
          groupByTarget: false,
          sortBySelector: false
        });
        addItems(menu);

        const bb = target.getBoundingClientRect() as DOMRect;

        menu.open({
          target,
          currentTarget: document.body,
          clientX: bb.x,
          clientY: bb.y
        } as any);

        expect(menu.menu.items).to.have.length(4);
        expect(menu.menu.items[1].command).to.equal('test-5');
        expect(menu.menu.items[0].command).to.equal('test-2');
        expect(menu.menu.items[2].command).to.equal('test-1');
        expect(menu.menu.items[3].command).to.equal('test-3');
      });

      it('should show items matching selector, ungrouped and ordered only by rank', () => {
        const target = document.createElement('div');
        target.className = CLASSNAME;
        document.body.appendChild(target);

        menu = new ContextMenu({
          commands,
          groupByTarget: false,
          sortBySelector: false
        });
        addItems(menu);

        const bb = target.getBoundingClientRect() as DOMRect;

        menu.open({
          target,
          currentTarget: document.body,
          clientX: bb.x,
          clientY: bb.y
        } as any);

        expect(menu.menu.items).to.have.length(4);
        expect(menu.menu.items[0].command).to.equal('test-2');
        expect(menu.menu.items[1].command).to.equal('test-5');
        expect(menu.menu.items[2].command).to.equal('test-1');
        expect(menu.menu.items[3].command).to.equal('test-3');
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import { expect } from 'chai';

import { DockPanel, TabBar, Widget } from '@lumino/widgets';

describe('@lumino/widgets', () => {
  describe('DockPanel', () => {
    describe('#constructor()', () => {
      it('should construct a new dock panel and take no arguments', () => {
        let panel = new DockPanel();
        expect(panel).to.be.an.instanceof(DockPanel);
      });

      it('should accept options', () => {
        let renderer = Object.create(TabBar.defaultRenderer);
        let panel = new DockPanel({
          tabsMovable: true,
          renderer,
          tabsConstrained: true
        });
        for (const tabBar of panel.tabBars()) {
          expect(tabBar.tabsMovable).to.equal(true);
        }
        for (const tabBar of panel.tabBars()) {
          expect(tabBar.renderer).to.equal(renderer);
        }
      });

      it('should not have tabs constrained by default', () => {
        let panel = new DockPanel();
        expect(panel.tabsConstrained).to.equal(false);
      });

      it('should add a `lm-DockPanel` class', () => {
        let panel = new DockPanel();
        expect(panel.hasClass('lm-DockPanel')).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the widget', () => {
        let panel = new DockPanel();
        panel.addWidget(new Widget());
        panel.dispose();
        expect(panel.isDisposed).to.equal(true);
        panel.dispose();
        expect(panel.isDisposed).to.equal(true);
      });
    });

    describe('hiddenMode', () => {
      let panel: DockPanel;
      let widgets: Widget[] = [];

      beforeEach(() => {
        panel = new DockPanel();

        // Create two stacked widgets
        widgets.push(new Widget());
        panel.addWidget(widgets[0]);
        widgets.push(new Widget());
        panel.addWidget(widgets[1], { mode: 'tab-after' });
      });

      afterEach(() => {
        panel.dispose();
      });

      it("should be 'display' mode by default", () => {
        expect(panel.hiddenMode).to.equal(Widget.HiddenMode.Display);
      });

      it("should switch to 'scale'", () => {
        widgets[0].hiddenMode = Widget.HiddenMode.Scale;

        panel.hiddenMode = Widget.HiddenMode.Scale;

        expect(widgets[0].hiddenMode).to.equal(Widget.HiddenMode.Scale);
        expect(widgets[1].hiddenMode).to.equal(Widget.HiddenMode.Scale);
      });

      it("should switch to 'display'", () => {
        widgets[0].hiddenMode = Widget.HiddenMode.Scale;

        panel.hiddenMode = Widget.HiddenMode.Scale;
        panel.hiddenMode = Widget.HiddenMode.Display;

        expect(widgets[0].hiddenMode).to.equal(Widget.HiddenMode.Display);
        expect(widgets[1].hiddenMode).to.equal(Widget.HiddenMode.Display);
      });

      it("should not set 'scale' if only one widget", () => {
        panel.layout!.removeWidget(widgets[1]);

        panel.hiddenMode = Widget.HiddenMode.Scale;

        expect(widgets[0].hiddenMode).to.equal(Widget.HiddenMode.Display);
      });
    });

    describe('#tabsMovable', () => {
      it('should get whether tabs are movable', () => {
        let panel = new DockPanel();
        expect(panel.tabsMovable).to.equal(true);
      });

      it('should set tabsMovable of all tabs', () => {
        let panel = new DockPanel();
        let w1 = new Widget();
        let w2 = new Widget();
        panel.addWidget(w1);
        panel.addWidget(w2, { mode: 'split-right', ref: w1 });
        for (const tabBar of panel.tabBars()) {
          expect(tabBar.tabsMovable).to.equal(true);
        }

        panel.tabsMovable = false;
        for (const tabBar of panel.tabBars()) {
          expect(tabBar.tabsMovable).to.equal(false);
        }
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { Platform } from '@lumino/domutils';

import { FocusTracker, Widget } from '@lumino/widgets';

describe('@lumino/widgets', () => {
  let _trackers: FocusTracker<Widget>[] = [];
  let _widgets: Widget[] = [];

  function createTracker(): FocusTracker<Widget> {
    let tracker = new FocusTracker<Widget>();
    _trackers.push(tracker);
    return tracker;
  }

  function createWidget(): Widget {
    let widget = new Widget();
    widget.node.tabIndex = -1;
    Widget.attach(widget, document.body);
    _widgets.push(widget);
    return widget;
  }

  function focusWidget(widget: Widget): void {
    widget.node.focus();
    if (Platform.IS_IE) {
      widget.node.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    }
  }

  function blurWidget(widget: Widget): void {
    widget.node.blur();
    if (Platform.IS_IE) {
      widget.node.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    }
  }

  afterEach(() => {
    while (_trackers.length > 0) {
      _trackers.pop()!.dispose();
    }
    while (_widgets.length > 0) {
      _widgets.pop()!.dispose();
    }
  });

  describe('FocusTracker', () => {
    describe('#constructor()', () => {
      it('should create a FocusTracker', () => {
        let tracker = new FocusTracker<Widget>();
        expect(tracker).to.be.an.instanceof(FocusTracker);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the tracker', () => {
        let tracker = new FocusTracker<Widget>();
        tracker.add(createWidget());
        tracker.dispose();
        expect(tracker.widgets.length).to.equal(0);
      });

      it('should be a no-op if already disposed', () => {
        let tracker = new FocusTracker<Widget>();
        tracker.dispose();
        tracker.dispose();
        expect(tracker.isDisposed).to.equal(true);
      });
    });

    describe('#currentChanged', () => {
      it('should be emitted when the current widget has changed', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        tracker.add(widget0);
        tracker.add(widget1);
        focusWidget(widget0);
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null;
        tracker.currentChanged.connect((sender, args) => {
          emitArgs = args;
        });
        focusWidget(widget1);
        expect(emitArgs).to.not.equal(null);
        expect(emitArgs!.oldValue).to.equal(widget0);
        expect(emitArgs!.newValue).to.equal(widget1);
      });

      it('should not be emitted when the current widget does not change', () => {
        let tracker = createTracker();
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null;
        tracker.currentChanged.connect((sender, args) => {
          emitArgs = args;
        });
        blurWidget(widget);
        focusWidget(widget);
        expect(emitArgs).to.equal(null);
      });
    });

    describe('#activeChanged', () => {
      it('should be emitted when the active widget has changed', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        tracker.add(widget0);
        tracker.add(widget1);
        focusWidget(widget0);
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null;
        tracker.activeChanged.connect((sender, args) => {
          emitArgs = args;
        });
        focusWidget(widget1);
        expect(emitArgs).to.not.equal(null);
        expect(emitArgs!.oldValue).to.equal(widget0);
        expect(emitArgs!.newValue).to.equal(widget1);
      });

      it('should be emitted when the active widget is set to null', () => {
        let tracker = createTracker();
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null;
        tracker.activeChanged.connect((sender, args) => {
          emitArgs = args;
        });
        blurWidget(widget);
        expect(emitArgs).to.not.equal(null);
        expect(emitArgs!.oldValue).to.equal(widget);
        expect(emitArgs!.newValue).to.equal(null);
      });
    });

    describe('#isDisposed', () => {
      it('should indicate whether the tracker is disposed', () => {
        let tracker = new FocusTracker<Widget>();
        expect(tracker.isDisposed).to.equal(false);
        tracker.dispose();
        expect(tracker.isDisposed).to.equal(true);
      });
    });

    describe('#currentWidget', () => {
      it('should get the current widget in the tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        expect(tracker.currentWidget).to.equal(widget);
      });

      it('should not be updated when the current widget loses focus', () => {
        let tracker = createTracker();
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        expect(tracker.currentWidget).to.equal(widget);
        blurWidget(widget);
        expect(tracker.currentWidget).to.equal(widget);
      });

      it('should be set to the widget that gained focus', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        focusWidget(widget0);
        tracker.add(widget0);
        tracker.add(widget1);
        expect(tracker.currentWidget).to.equal(widget0);
        focusWidget(widget1);
        expect(tracker.currentWidget).to.equal(widget1);
      });

      it('should revert to the previous widget if the current widget is removed', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        focusWidget(widget0);
        tracker.add(widget0);
        tracker.add(widget1);
        focusWidget(widget1);
        expect(tracker.currentWidget).to.equal(widget1);
        widget1.dispose();
        expect(tracker.currentWidget).to.equal(widget0);
      });

      it('should be `null` if there is no current widget', () => {
        let tracker = createTracker();
        expect(tracker.currentWidget).to.equal(null);
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        expect(tracker.currentWidget).to.equal(widget);
        widget.dispose();
        expect(tracker.currentWidget).to.equal(null);
      });
    });

    describe('#activeWidget', () => {
      it('should get the active widget in the tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        expect(tracker.activeWidget).to.equal(widget);
      });

      it('should be set to `null` when the active widget loses focus', () => {
        let tracker = createTracker();
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        expect(tracker.activeWidget).to.equal(widget);
        blurWidget(widget);
        expect(tracker.activeWidget).to.equal(null);
      });

      it('should be set to the widget that gained focus', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        focusWidget(widget0);
        tracker.add(widget0);
        tracker.add(widget1);
        expect(tracker.activeWidget).to.equal(widget0);
        focusWidget(widget1);
        expect(tracker.activeWidget).to.equal(widget1);
      });

      it('should be `null` if there is no active widget', () => {
        let tracker = createTracker();
        expect(tracker.currentWidget).to.equal(null);
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        expect(tracker.activeWidget).to.equal(widget);
        widget.dispose();
        expect(tracker.activeWidget).to.equal(null);
      });
    });

    describe('#widgets', () => {
      it('should be a read-only sequence of the widgets being tracked', () => {
        let tracker = createTracker();
        expect(tracker.widgets.length).to.equal(0);
        let widget = createWidget();
        tracker.add(widget);
        expect(tracker.widgets.length).to.equal(1);
        expect(tracker.widgets[0]).to.equal(widget);
      });
    });

    describe('#focusNumber()', () => {
      it('should get the focus number for a particular widget in the tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        expect(tracker.focusNumber(widget)).to.equal(0);
      });

      it('should give the highest number for the currentWidget', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        focusWidget(widget0);
        tracker.add(widget0);
        tracker.add(widget1);
        focusWidget(widget1);
        expect(tracker.focusNumber(widget1)).to.equal(1);
        expect(tracker.focusNumber(widget0)).to.equal(0);
        focusWidget(widget0);
        expect(tracker.focusNumber(widget0)).to.equal(2);
      });

      it('should start a widget with a focus number of `-1`', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        expect(tracker.focusNumber(widget)).to.equal(-1);
      });

      it('should update when a widget gains focus', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        focusWidget(widget0);
        tracker.add(widget0);
        tracker.add(widget1);
        focusWidget(widget1);
        expect(tracker.focusNumber(widget0)).to.equal(0);
        focusWidget(widget0);
        expect(tracker.focusNumber(widget0)).to.equal(2);
      });
    });

    describe('#has()', () => {
      it('should test whether the focus tracker contains a given widget', () => {
        let tracker = createTracker();
        let widget = createWidget();
        expect(tracker.has(widget)).to.equal(false);
        tracker.add(widget);
        expect(tracker.has(widget)).to.equal(true);
      });
    });

    describe('#add()', () => {
      it('should add a widget to the focus tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        expect(tracker.has(widget)).to.equal(true);
      });

      it('should make the widget the currentWidget if focused', () => {
        let tracker = createTracker();
        let widget = createWidget();
        focusWidget(widget);
        tracker.add(widget);
        expect(tracker.currentWidget).to.equal(widget);
      });

      it('should remove the widget from the tracker after it has been disposed', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        widget.dispose();
        expect(tracker.has(widget)).to.equal(false);
      });

      it('should be a no-op if the widget is already tracked', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        tracker.add(widget);
        expect(tracker.has(widget)).to.equal(true);
      });
    });

    describe('#remove()', () => {
      it('should remove a widget from the focus tracker', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.add(widget);
        tracker.remove(widget);
        expect(tracker.has(widget)).to.equal(false);
      });

      it('should set the currentWidget to the previous one if the widget is the currentWidget', () => {
        let tracker = createTracker();
        let widget0 = createWidget();
        let widget1 = createWidget();
        let widget2 = createWidget();
        focusWidget(widget0);
        tracker.add(widget0);
        tracker.add(widget1);
        tracker.add(widget2);
        focusWidget(widget1);
        focusWidget(widget2);
        tracker.remove(widget2);
        expect(tracker.currentWidget).to.equal(widget1);
      });

      it('should be a no-op if the widget is not tracked', () => {
        let tracker = createTracker();
        let widget = createWidget();
        tracker.remove(widget);
        expect(tracker.has(widget)).to.equal(false);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import '@lumino/widgets/style/index.css';

import './accordionlayout.spec';
import './accordionpanel.spec';
import './boxengine.spec';
import './boxlayout.spec';
import './boxpanel.spec';
import './commandpalette.spec';
import './contextmenu.spec';
import './docklayout.spec';
import './dockpanel.spec';
import './focustracker.spec';
import './layout.spec';
import './menu.spec';
import './menubar.spec';
import './panel.spec';
import './panellayout.spec';
import './splitlayout.spec';
import './splitpanel.spec';
import './stackedlayout.spec';
import './stackedpanel.spec';
import './tabbar.spec';
import './tabpanel.spec';
import './title.spec';
import './widget.spec';
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { ArrayExt, every } from '@lumino/algorithm';

import { Message, MessageLoop } from '@lumino/messaging';

import { Layout, Widget } from '@lumino/widgets';

import { LogWidget } from './widget.spec';

class LogLayout extends Layout {
  methods: string[] = [];

  widgets = [new LogWidget(), new LogWidget()];

  dispose(): void {
    while (this.widgets.length !== 0) {
      this.widgets.pop()!.dispose();
    }
    super.dispose();
  }

  *[Symbol.iterator](): IterableIterator<Widget> {
    yield* this.widgets;
  }

  removeWidget(widget: Widget): void {
    this.methods.push('removeWidget');
    ArrayExt.removeFirstOf(this.widgets, widget);
  }

  protected init(): void {
    this.methods.push('init');
    super.init();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.methods.push('onResize');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onBeforeHide(msg: Message): void {
    super.onBeforeHide(msg);
    this.methods.push('onBeforeHide');
  }

  protected onFitRequest(msg: Widget.ChildMessage): void {
    super.onFitRequest(msg);
    this.methods.push('onFitRequest');
  }

  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg);
    this.methods.push('onChildShown');
  }

  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg);
    this.methods.push('onChildHidden');
  }
}

describe('@lumino/widgets', () => {
  describe('Layout', () => {
    describe('[Symbol.iterator]()', () => {
      it('should create an iterator over the widgets in the layout', () => {
        let layout = new LogLayout();
        expect(every(layout, child => child instanceof Widget)).to.equal(true);
      });
    });

    describe('#removeWidget()', () => {
      it("should be invoked when a child widget's `parent` property is set to `null`", () => {
        let parent = new Widget();
        let layout = new LogLayout();
        parent.layout = layout;
        layout.widgets[0].parent = null;
        expect(layout.methods).to.contain('removeWidget');
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resource held by the layout', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        layout.dispose();
        expect(layout.parent).to.equal(null);
        expect(every(widget.children(), w => w.isDisposed)).to.equal(true);
      });

      it('should be called automatically when the parent is disposed', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.parent).to.equal(null);
        expect(layout.isDisposed).to.equal(true);
      });
    });

    describe('#isDisposed', () => {
      it('should test whether the layout is disposed', () => {
        let layout = new LogLayout();
        expect(layout.isDisposed).to.equal(false);
        layout.dispose();
        expect(layout.isDisposed).to.equal(true);
      });
    });

    describe('#parent', () => {
      it('should get the parent widget of the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        expect(layout.parent).to.equal(parent);
      });

      it('should throw an error if set to `null`', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        expect(() => {
          layout.parent = null;
        }).to.throw(Error);
      });

      it('should throw an error if set to a different value', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        expect(() => {
          layout.parent = new Widget();
        }).to.throw(Error);
      });

      it('should be a no-op if the parent is set to the same value', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        layout.parent = parent;
        expect(layout.parent).to.equal(parent);
      });
    });

    describe('#init()', () => {
      it('should be invoked when the layout is installed on its parent widget', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        expect(layout.methods).to.contain('init');
      });

      it('should reparent the child widgets', () => {
        let widget = new Widget();
        let layout = new LogLayout();
        widget.layout = layout;
        expect(every(layout, child => child.parent === widget)).to.equal(true);
      });
    });

    describe('#onResize()', () => {
      it('should be invoked on a `resize` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
      });

      it('should send a `resize` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
        expect(layout.widgets[0].methods).to.contain('onResize');
        expect(layout.widgets[1].methods).to.contain('onResize');
      });
    });

    describe('#onUpdateRequest()', () => {
      it('should be invoked on an `update-request` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest);
        expect(layout.methods).to.contain('onUpdateRequest');
      });

      it('should send a `resize` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest);
        expect(layout.methods).to.contain('onUpdateRequest');
        expect(layout.widgets[0].methods).to.contain('onResize');
        expect(layout.widgets[1].methods).to.contain('onResize');
      });
    });

    describe('#onAfterAttach()', () => {
      it('should be invoked on an `after-attach` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.AfterAttach);
        expect(layout.methods).to.contain('onAfterAttach');
      });

      it('should send an `after-attach` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.AfterAttach);
        expect(layout.methods).to.contain('onAfterAttach');
        expect(layout.widgets[0].methods).to.contain('onAfterAttach');
        expect(layout.widgets[1].methods).to.contain('onAfterAttach');
      });
    });

    describe('#onBeforeDetach()', () => {
      it('should be invoked on an `before-detach` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeDetach);
        expect(layout.methods).to.contain('onBeforeDetach');
      });

      it('should send a `before-detach` message to each of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeDetach);
        expect(layout.methods).to.contain('onBeforeDetach');
        expect(layout.widgets[0].methods).to.contain('onBeforeDetach');
        expect(layout.widgets[1].methods).to.contain('onBeforeDetach');
      });
    });

    describe('#onAfterShow()', () => {
      it('should be invoked on an `after-show` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.AfterShow);
        expect(layout.methods).to.contain('onAfterShow');
      });

      it('should send an `after-show` message to non hidden of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        layout.widgets[0].hide();
        MessageLoop.sendMessage(parent, Widget.Msg.AfterShow);
        expect(layout.methods).to.contain('onAfterShow');
        expect(layout.widgets[0].methods).to.not.contain('onAfterShow');
        expect(layout.widgets[1].methods).to.contain('onAfterShow');
      });
    });

    describe('#onBeforeHide()', () => {
      it('should be invoked on a `before-hide` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeHide);
        expect(layout.methods).to.contain('onBeforeHide');
      });

      it('should send a `before-hide` message to non hidden of the widgets in the layout', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        layout.widgets[0].hide();
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeHide);
        expect(layout.methods).to.contain('onBeforeHide');
        expect(layout.widgets[0].methods).to.not.contain('onBeforeHide');
        expect(layout.widgets[1].methods).to.contain('onBeforeHide');
      });
    });

    describe('#onFitRequest()', () => {
      it('should be invoked on an `fit-request` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        MessageLoop.sendMessage(parent, Widget.Msg.FitRequest);
        expect(layout.methods).to.contain('onFitRequest');
      });
    });

    describe('#onChildShown()', () => {
      it('should be invoked on an `child-shown` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        let msg = new Widget.ChildMessage('child-shown', new Widget());
        MessageLoop.sendMessage(parent, msg);
        expect(layout.methods).to.contain('onChildShown');
      });
    });

    describe('#onChildHidden()', () => {
      it('should be invoked on an `child-hidden` message', () => {
        let layout = new LogLayout();
        let parent = new Widget();
        parent.layout = layout;
        let msg = new Widget.ChildMessage('child-hidden', new Widget());
        MessageLoop.sendMessage(parent, msg);
        expect(layout.methods).to.contain('onChildHidden');
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { CommandRegistry } from '@lumino/commands';

import { JSONObject } from '@lumino/coreutils';

import { Platform } from '@lumino/domutils';

import { Message } from '@lumino/messaging';

import { h, VirtualDOM } from '@lumino/virtualdom';

import { Menu, Widget } from '@lumino/widgets';

class LogMenu extends Menu {
  events: string[] = [];

  methods: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.methods.push('onBeforeAttach');
  }

  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg);
    this.methods.push('onAfterDetach');
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.methods.push('onActivateRequest');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.methods.push('onCloseRequest');
  }
}

const bubbles = true;

describe('@lumino/widgets', () => {
  let commands = new CommandRegistry();
  let logMenu: LogMenu = null!;
  let menu: Menu = null!;
  let executed = '';
  const iconClass = 'foo';
  const iconRenderer = {
    render: (host: HTMLElement, options?: any) => {
      const renderNode = document.createElement('div');
      host.classList.add(iconClass);
      host.appendChild(renderNode);
    }
  };

  before(() => {
    commands.addCommand('test', {
      execute: (args: JSONObject) => {
        executed = 'test';
      },
      label: 'Test Label',
      icon: iconRenderer,
      iconClass,
      caption: 'Test Caption',
      className: 'testClass',
      mnemonic: 0
    });
    commands.addCommand('test-toggled', {
      execute: (args: JSONObject) => {
        executed = 'test-toggled';
      },
      label: 'Test Toggled Label',
      icon: iconRenderer,
      className: 'testClass',
      isToggled: (args: JSONObject) => true,
      mnemonic: 6
    });
    commands.addCommand('test-disabled', {
      execute: (args: JSONObject) => {
        executed = 'test-disabled';
      },
      label: 'Test Disabled Label',
      icon: iconRenderer,
      className: 'testClass',
      isEnabled: (args: JSONObject) => false,
      mnemonic: 5
    });
    commands.addCommand('test-hidden', {
      execute: (args: JSONObject) => {
        executed = 'test-hidden';
      },
      label: 'Hidden Label',
      icon: iconRenderer,
      className: 'testClass',
      isVisible: (args: JSONObject) => false
    });
    commands.addCommand('test-zenith', {
      execute: (args: JSONObject) => {
        executed = 'test-zenith';
      },
      label: 'Zenith Label',
      icon: iconRenderer,
      className: 'testClass'
    });
    commands.addKeyBinding({
      keys: ['Ctrl T'],
      selector: 'body',
      command: 'test'
    });
  });

  beforeEach(() => {
    executed = '';
    menu = new Menu({ commands });
    logMenu = new LogMenu({ commands });
  });

  afterEach(() => {
    menu.dispose();
    logMenu.dispose();
  });

  describe('Menu', () => {
    describe('#constructor()', () => {
      it('should take options for initializing the menu', () => {
        let menu = new Menu({ commands });
        expect(menu).to.be.an.instanceof(Menu);
      });

      it('should add the `lm-Menu` class', () => {
        let menu = new Menu({ commands });
        expect(menu.hasClass('lm-Menu')).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the menu', () => {
        menu.addItem({});
        expect(menu.items.length).to.equal(1);
        menu.dispose();
        expect(menu.items.length).to.equal(0);
        expect(menu.isDisposed).to.equal(true);
      });
    });

    describe('#aboutToClose', () => {
      it('should be emitted just before the menu is closed', () => {
        let called = false;
        menu.open(0, 0);
        menu.aboutToClose.connect((sender, args) => {
          called = true;
        });
        menu.close();
        expect(called).to.equal(true);
      });

      it('should not be emitted if the menu is not attached', () => {
        let called = false;
        menu.open(0, 0);
        menu.aboutToClose.connect(() => {
          called = true;
        });
        Widget.detach(menu);
        menu.close();
        expect(called).to.equal(false);
      });
    });

    describe('menuRequested', () => {
      it('should be emitted when a left arrow key is pressed and a submenu cannot be opened or closed', () => {
        let called = false;
        menu.open(0, 0);
        menu.menuRequested.connect((sender, args) => {
          expect(args).to.equal('previous');
          called = true;
        });
        menu.node.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles,
            keyCode: 37 // Left arrow
          })
        );
        expect(called).to.equal(true);
      });

      it('should be emitted when a right arrow key is pressed and a submenu cannot be opened or closed', () => {
        let called = false;
        menu.open(0, 0);
        menu.menuRequested.connect((sender, args) => {
          expect(args).to.equal('next');
          called = true;
        });
        menu.node.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles,
            keyCode: 39 // Right arrow
          })
        );
        expect(called).to.equal(true);
      });

      it('should only be emitted for the root menu in a hierarchy', () => {
        let submenu = new Menu({ commands });
        let item = menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        menu.activeItem = item;
        menu.triggerActiveItem();
        let called = false;
        let submenuCalled = false;
        menu.menuRequested.connect((sender, args) => {
          expect(args).to.equal('next');
          called = true;
        });
        submenu.menuRequested.connect(() => {
          submenuCalled = true;
        });
        submenu.node.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles,
            keyCode: 39 // Right arrow
          })
        );
        expect(called).to.equal(true);
        expect(submenuCalled).to.equal(false);
      });
    });

    describe('#commands', () => {
      it('should be the command registry for the menu', () => {
        expect(menu.commands).to.equal(commands);
      });
    });

    describe('#renderer', () => {
      it('should default to the default renderer', () => {
        expect(menu.renderer).to.equal(Menu.defaultRenderer);
      });

      it('should be the renderer for the menu', () => {
        let renderer = Object.create(Menu.defaultRenderer);
        let menu = new Menu({ commands, renderer });
        expect(menu.renderer).to.equal(renderer);
      });
    });

    describe('#parentMenu', () => {
      it('should get the parent menu of the menu', () => {
        let submenu = new Menu({ commands });
        let item = menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        menu.activeItem = item;
        menu.triggerActiveItem();
        expect(submenu.parentMenu).to.equal(menu);
      });

      it('should be `null` if the menu is not an open submenu', () => {
        let submenu = new Menu({ commands });
        menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        expect(submenu.parentMenu).to.equal(null);
        expect(menu.parentMenu).to.equal(null);
      });
    });

    describe('#childMenu', () => {
      it('should get the child menu of the menu', () => {
        let submenu = new Menu({ commands });
        let item = menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        menu.activeItem = item;
        menu.triggerActiveItem();
        expect(menu.childMenu).to.equal(submenu);
      });

      it('should be `null` if the menu does not have an open submenu', () => {
        let submenu = new Menu({ commands });
        menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        expect(menu.childMenu).to.equal(null);
      });
    });

    describe('#rootMenu', () => {
      it('should get the root menu of the menu hierarchy', () => {
        let submenu1 = new Menu({ commands });
        let submenu2 = new Menu({ commands });
        let item1 = menu.addItem({ type: 'submenu', submenu: submenu1 });
        let item2 = submenu1.addItem({ type: 'submenu', submenu: submenu2 });
        menu.open(0, 0);
        menu.activeItem = item1;
        menu.triggerActiveItem();
        submenu1.activeItem = item2;
        submenu1.triggerActiveItem();
        expect(submenu2.rootMenu).to.equal(menu);
      });

      it('should be itself if the menu is not an open submenu', () => {
        let submenu1 = new Menu({ commands });
        let submenu2 = new Menu({ commands });
        menu.addItem({ type: 'submenu', submenu: submenu1 });
        submenu1.addItem({ type: 'submenu', submenu: submenu2 });
        menu.open(0, 0);
        expect(menu.rootMenu).to.equal(menu);
        expect(submenu1.rootMenu).to.equal(submenu1);
        expect(submenu2.rootMenu).to.equal(submenu2);
      });
    });

    describe('#leafMenu', () => {
      it('should get the leaf menu of the menu hierarchy', () => {
        let submenu1 = new Menu({ commands });
        let submenu2 = new Menu({ commands });
        let item1 = menu.addItem({ type: 'submenu', submenu: submenu1 });
        let item2 = submenu1.addItem({ type: 'submenu', submenu: submenu2 });
        menu.open(0, 0);
        menu.activeItem = item1;
        menu.triggerActiveItem();
        submenu1.activeItem = item2;
        submenu1.triggerActiveItem();
        expect(menu.leafMenu).to.equal(submenu2);
      });

      it('should be itself if the menu does not have an open submenu', () => {
        let submenu1 = new Menu({ commands });
        let submenu2 = new Menu({ commands });
        menu.addItem({ type: 'submenu', submenu: submenu1 });
        submenu1.addItem({ type: 'submenu', submenu: submenu2 });
        menu.open(0, 0);
        expect(menu.leafMenu).to.equal(menu);
        expect(submenu1.leafMenu).to.equal(submenu1);
        expect(submenu2.leafMenu).to.equal(submenu2);
      });
    });

    describe('#contentNode', () => {
      it('should get the menu content node', () => {
        let content = menu.contentNode;
        expect(content.classList.contains('lm-Menu-content')).to.equal(true);
      });
    });

    describe('#activeItem', () => {
      it('should get the currently active menu item', () => {
        let item = menu.addItem({ command: 'test' });
        menu.activeIndex = 0;
        expect(menu.activeItem).to.equal(item);
      });

      it('should be `null` if no menu item is active', () => {
        expect(menu.activeItem).to.equal(null);
        menu.addItem({ command: 'test' });
        expect(menu.activeItem).to.equal(null);
      });

      it('should set the currently active menu item', () => {
        expect(menu.activeItem).to.equal(null);
        let item = (menu.activeItem = menu.addItem({ command: 'test' }));
        expect(menu.activeItem).to.equal(item);
      });

      it('should set to `null` if the item cannot be activated', () => {
        expect(menu.activeItem).to.equal(null);
        menu.activeItem = menu.addItem({ command: 'test-disabled' });
        expect(menu.activeItem).to.equal(null);
      });
    });

    describe('#activeIndex', () => {
      it('should get the index of the currently active menu item', () => {
        menu.activeItem = menu.addItem({ command: 'test' });
        expect(menu.activeIndex).to.equal(0);
      });

      it('should be `-1` if no menu item is active', () => {
        expect(menu.activeIndex).to.equal(-1);
        menu.addItem({ command: 'test' });
        expect(menu.activeIndex).to.equal(-1);
      });

      it('should set the currently active menu item index', () => {
        expect(menu.activeIndex).to.equal(-1);
        menu.addItem({ command: 'test' });
        menu.activeIndex = 0;
        expect(menu.activeIndex).to.equal(0);
      });

      it('should set to `-1` if the item cannot be activated', () => {
        menu.addItem({ command: 'test-disabled' });
        menu.activeIndex = 0;
        expect(menu.activeIndex).to.equal(-1);
      });
    });

    describe('#items', () => {
      it('should be a read-only array of the menu items in the menu', () => {
        let item1 = menu.addItem({ command: 'foo' });
        let item2 = menu.addItem({ command: 'bar' });
        expect(menu.items).to.deep.equal([item1, item2]);
      });
    });

    describe('#activateNextItem()', () => {
      it('should activate the next selectable item in the menu', () => {
        menu.addItem({ command: 'test-disabled' });
        menu.addItem({ command: 'test' });
        menu.activateNextItem();
        expect(menu.activeIndex).to.equal(1);
      });

      it('should set the index to `-1` if no item is selectable', () => {
        menu.addItem({ command: 'test-disabled' });
        menu.addItem({ type: 'separator' });
        menu.activateNextItem();
        expect(menu.activeIndex).to.equal(-1);
      });
    });

    describe('#activatePreviousItem()', () => {
      it('should activate the next selectable item in the menu', () => {
        menu.addItem({ command: 'test' });
        menu.addItem({ command: 'test-disabled' });
        menu.activatePreviousItem();
        expect(menu.activeIndex).to.equal(0);
      });

      it('should set the index to `-1` if no item is selectable', () => {
        menu.addItem({ command: 'test-disabled' });
        menu.addItem({ type: 'separator' });
        menu.activatePreviousItem();
        expect(menu.activeIndex).to.equal(-1);
      });
    });

    describe('#triggerActiveItem()', () => {
      it('should execute a command if it is the active item', () => {
        menu.addItem({ command: 'test' });
        menu.open(0, 0);
        menu.activeIndex = 0;
        menu.triggerActiveItem();
        expect(executed).to.equal('test');
      });

      it('should open a submenu and activate the first item', () => {
        let submenu = new Menu({ commands });
        submenu.addItem({ command: 'test' });
        menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        menu.activeIndex = 0;
        menu.triggerActiveItem();
        expect(submenu.parentMenu).to.equal(menu);
        expect(submenu.activeIndex).to.equal(0);
      });

      it('should be a no-op if the menu is not attached', () => {
        let submenu = new Menu({ commands });
        submenu.addItem({ command: 'test' });
        menu.addItem({ type: 'submenu', submenu });
        menu.activeIndex = 0;
        menu.triggerActiveItem();
        expect(submenu.parentMenu).to.equal(null);
        expect(submenu.activeIndex).to.equal(-1);
      });

      it('should be a no-op if there is no active item', () => {
        let submenu = new Menu({ commands });
        submenu.addItem({ command: 'test' });
        menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        menu.triggerActiveItem();
        expect(submenu.parentMenu).to.equal(null);
        expect(submenu.activeIndex).to.equal(-1);
      });
    });

    describe('#addItem()', () => {
      it('should add a menu item to the end of the menu', () => {
        menu.addItem({});
        let item = menu.addItem({ command: 'test' });
        expect(menu.items[1]).to.equal(item);
      });
    });

    describe('#insertItem()', () => {
      it('should insert a menu item into the menu at the specified index', () => {
        let item1 = menu.insertItem(0, { command: 'test' });
        let item2 = menu.insertItem(0, { command: 'test-disabled' });
        let item3 = menu.insertItem(0, { command: 'test-toggled' });
        expect(menu.items[0]).to.equal(item3);
        expect(menu.items[1]).to.equal(item2);
        expect(menu.items[2]).to.equal(item1);
      });

      it('should clamp the index to the bounds of the items', () => {
        let item1 = menu.insertItem(0, { command: 'test' });
        let item2 = menu.insertItem(10, { command: 'test-disabled' });
        let item3 = menu.insertItem(-10, { command: 'test-toggled' });
        expect(menu.items[0]).to.equal(item3);
        expect(menu.items[1]).to.equal(item1);
        expect(menu.items[2]).to.equal(item2);
      });

      it('should close the menu if attached', () => {
        menu.open(0, 0);
        expect(menu.isAttached).to.equal(true);
        menu.insertItem(0, { command: 'test' });
        expect(menu.isAttached).to.equal(false);
      });
    });

    describe('#removeItem()', () => {
      it('should remove a menu item from the menu by value', () => {
        menu.removeItem(menu.addItem({ command: 'test' }));
        expect(menu.items.length).to.equal(0);
      });

      it('should close the menu if it is attached', () => {
        let item = menu.addItem({ command: 'test' });
        menu.open(0, 0);
        expect(menu.isAttached).to.equal(true);
        menu.removeItem(item);
        expect(menu.isAttached).to.equal(false);
      });
    });

    describe('#removeItemAt()', () => {
      it('should remove a menu item from the menu by index', () => {
        menu.addItem({ command: 'test' });
        menu.removeItemAt(0);
        expect(menu.items.length).to.equal(0);
      });

      it('should close the menu if it is attached', () => {
        menu.addItem({ command: 'test' });
        menu.open(0, 0);
        expect(menu.isAttached).to.equal(true);
        menu.removeItemAt(0);
        expect(menu.isAttached).to.equal(false);
      });
    });

    describe('#clearItems()', () => {
      it('should remove all items from the menu', () => {
        menu.addItem({ command: 'test-disabled' });
        menu.addItem({ command: 'test' });
        menu.activeIndex = 1;
        menu.clearItems();
        expect(menu.items.length).to.equal(0);
        expect(menu.activeIndex).to.equal(-1);
      });

      it('should close the menu if it is attached', () => {
        menu.addItem({ command: 'test-disabled' });
        menu.addItem({ command: 'test' });
        menu.open(0, 0);
        expect(menu.isAttached).to.equal(true);
        menu.clearItems();
        expect(menu.isAttached).to.equal(false);
      });
    });

    describe('#open()', () => {
      it('should open the menu at the specified location', () => {
        menu.addItem({ command: 'test' });
        menu.open(10, 10);
        expect(menu.node.style.left).to.equal('10px');
        expect(menu.node.style.top).to.equal('10px');
      });

      it('should be adjusted to fit naturally on the screen', () => {
        menu.addItem({ command: 'test' });
        menu.open(-10, 10000);
        expect(menu.node.style.left).to.equal('0px');
        expect(menu.node.style.top).to.not.equal('10000px');
      });

      it('should accept flags to force the location', () => {
        menu.addItem({ command: 'test' });
        menu.open(10000, 10000, { forceX: true, forceY: true });
        expect(menu.node.style.left).to.equal('10000px');
        expect(menu.node.style.top).to.equal('10000px');
      });

      it('should bail if already attached', () => {
        menu.addItem({ command: 'test' });
        menu.open(10, 10);
        menu.open(100, 100);
        expect(menu.node.style.left).to.equal('10px');
        expect(menu.node.style.top).to.equal('10px');
      });
    });

    describe('#handleEvent()', () => {
      context('keydown', () => {
        it('should trigger the active item on enter', () => {
          menu.addItem({ command: 'test' });
          menu.activeIndex = 0;
          menu.open(0, 0);
          menu.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 13 // Enter
            })
          );
          expect(executed).to.equal('test');
        });

        it('should close the menu on escape', () => {
          menu.open(0, 0);
          expect(menu.isAttached).to.equal(true);
          menu.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 27 // Escape
            })
          );
          expect(menu.isAttached).to.equal(false);
        });

        it('should close the menu on left arrow if there is a parent menu', () => {
          let submenu = new Menu({ commands });
          submenu.addItem({ command: 'test' });
          menu.addItem({ type: 'submenu', submenu });
          menu.open(0, 0);
          menu.activateNextItem();
          menu.triggerActiveItem();
          expect(menu.childMenu).to.equal(submenu);
          submenu.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 37 // Left arrow
            })
          );
          expect(menu.childMenu).to.equal(null);
        });

        it('should activate the previous item on up arrow', () => {
          menu.addItem({ command: 'test' });
          menu.addItem({ command: 'test' });
          menu.addItem({ command: 'test' });
          menu.open(0, 0);
          menu.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 38 // Up arrow
            })
          );
          expect(menu.activeIndex).to.equal(2);
        });

        it('should trigger the active item on right arrow if the item is a submenu', () => {
          let submenu = new Menu({ commands });
          submenu.addItem({ command: 'test' });
          menu.addItem({ type: 'submenu', submenu });
          menu.open(0, 0);
          menu.activateNextItem();
          expect(menu.childMenu).to.equal(null);
          menu.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 39 // Right arrow
            })
          );
          expect(menu.childMenu).to.equal(submenu);
        });

        it('should activate the next item on down arrow', () => {
          menu.addItem({ command: 'test' });
          menu.addItem({ command: 'test' });
          menu.open(0, 0);
          menu.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 40 // Down arrow
            })
          );
          expect(menu.activeIndex).to.equal(0);
        });

        it('should activate the first matching mnemonic', () => {
          let submenu1 = new Menu({ commands });
          submenu1.title.label = 'foo';
          submenu1.title.mnemonic = 0;
          submenu1.addItem({ command: 'test' });

          let submenu2 = new Menu({ commands });
          submenu2.title.label = 'bar';
          submenu2.title.mnemonic = 0;
          submenu2.addItem({ command: 'test' });

          menu.addItem({ type: 'submenu', submenu: submenu1 });
          menu.addItem({ type: 'separator' });
          menu.addItem({ type: 'submenu', submenu: submenu2 });

          menu.open(0, 0);
          menu.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 70 // `F` key
            })
          );
          expect(menu.activeIndex).to.equal(0);
        });

        it('should activate an item with no matching mnemonic, but matching first character', () => {
          menu.addItem({ command: 'test' });
          menu.addItem({ command: 'test-disabled' });
          menu.addItem({ command: 'test-toggled' });
          menu.addItem({ command: 'test-hidden' });
          menu.addItem({ command: 'test-zenith' });
          menu.open(0, 0);
          expect(menu.activeIndex).to.equal(-1);
          menu.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 90 // `Z` key
            })
          );
          expect(menu.activeIndex).to.equal(4);
        });
      });

      context('mouseup', () => {
        it('should trigger the active item', () => {
          menu.addItem({ command: 'test' });
          menu.activeIndex = 0;
          menu.open(0, 0);
          menu.node.dispatchEvent(new MouseEvent('mouseup', { bubbles }));
          expect(executed).to.equal('test');
        });

        it('should bail if not a left mouse button', () => {
          menu.addItem({ command: 'test' });
          menu.activeIndex = 0;
          menu.open(0, 0);
          menu.node.dispatchEvent(
            new MouseEvent('mouseup', {
              bubbles,
              button: 1
            })
          );
          expect(executed).to.equal('');
        });
      });

      context('mousemove', () => {
        it('should set the active index', () => {
          menu.addItem({ command: 'test' });
          menu.open(0, 0);
          let node = menu.node.getElementsByClassName('lm-Menu-item')[0];
          let rect = node.getBoundingClientRect();
          menu.node.dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(menu.activeIndex).to.equal(0);
        });

        it('should open a child menu after a timeout', done => {
          let submenu = new Menu({ commands });
          submenu.addItem({ command: 'test' });
          submenu.title.label = 'Test Label';
          menu.addItem({ type: 'submenu', submenu });
          menu.open(0, 0);
          let node = menu.node.getElementsByClassName('lm-Menu-item')[0];
          let rect = node.getBoundingClientRect();
          menu.node.dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(menu.activeIndex).to.equal(0);
          expect(submenu.isAttached).to.equal(false);
          setTimeout(() => {
            expect(submenu.isAttached).to.equal(true);
            done();
          }, 500);
        });

        it('should close an open sub menu', done => {
          let submenu = new Menu({ commands });
          submenu.addItem({ command: 'test' });
          submenu.title.label = 'Test Label';
          menu.addItem({ command: 'test' });
          menu.addItem({ type: 'submenu', submenu });
          menu.open(0, 0);
          menu.activeIndex = 1;
          menu.triggerActiveItem();
          let node = menu.node.getElementsByClassName('lm-Menu-item')[0];
          let rect = node.getBoundingClientRect();
          menu.node.dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(menu.activeIndex).to.equal(0);
          expect(submenu.isAttached).to.equal(true);
          setTimeout(() => {
            expect(submenu.isAttached).to.equal(false);
            done();
          }, 500);
        });
      });

      context('mouseleave', () => {
        it('should reset the active index', () => {
          let submenu = new Menu({ commands });
          submenu.addItem({ command: 'test' });
          submenu.title.label = 'Test Label';
          menu.addItem({ type: 'submenu', submenu });
          menu.open(0, 0);
          let node = menu.node.getElementsByClassName('lm-Menu-item')[0];
          let rect = node.getBoundingClientRect();
          menu.node.dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(menu.activeIndex).to.equal(0);
          menu.node.dispatchEvent(
            new MouseEvent('mouseleave', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(menu.activeIndex).to.equal(-1);
          menu.dispose();
        });
      });

      context('mousedown', () => {
        it('should not close the menu if on a child node', () => {
          menu.addItem({ command: 'test' });
          menu.open(0, 0);
          expect(menu.isAttached).to.equal(true);
          let rect = menu.node.getBoundingClientRect();
          menu.node.dispatchEvent(
            new MouseEvent('mousedown', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(menu.isAttached).to.equal(true);
        });

        it('should close the menu if not on a child node', () => {
          menu.addItem({ command: 'test' });
          menu.open(0, 0);
          expect(menu.isAttached).to.equal(true);
          menu.node.dispatchEvent(
            new MouseEvent('mousedown', {
              bubbles,
              clientX: -10
            })
          );
          expect(menu.isAttached).to.equal(false);
        });
      });
    });

    describe('#onBeforeAttach()', () => {
      it('should add event listeners', () => {
        let node = logMenu.node;
        logMenu.open(0, 0);
        expect(logMenu.methods).to.contain('onBeforeAttach');
        node.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
        expect(logMenu.events).to.contain('keydown');
        node.dispatchEvent(new MouseEvent('mouseup', { bubbles }));
        expect(logMenu.events).to.contain('mouseup');
        node.dispatchEvent(new MouseEvent('mousemove', { bubbles }));
        expect(logMenu.events).to.contain('mousemove');
        node.dispatchEvent(new MouseEvent('mouseenter', { bubbles }));
        expect(logMenu.events).to.contain('mouseenter');
        node.dispatchEvent(new MouseEvent('mouseleave', { bubbles }));
        expect(logMenu.events).to.contain('mouseleave');
        node.dispatchEvent(new MouseEvent('contextmenu', { bubbles }));
        expect(logMenu.events).to.contain('contextmenu');
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles }));
        expect(logMenu.events).to.contain('mousedown');
      });
    });

    describe('#onAfterDetach()', () => {
      it('should remove event listeners', () => {
        let node = logMenu.node;
        logMenu.open(0, 0);
        logMenu.close();
        expect(logMenu.methods).to.contain('onAfterDetach');
        node.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
        expect(logMenu.events).to.not.contain('keydown');
        node.dispatchEvent(new MouseEvent('mouseup', { bubbles }));
        expect(logMenu.events).to.not.contain('mouseup');
        node.dispatchEvent(new MouseEvent('mousemove', { bubbles }));
        expect(logMenu.events).to.not.contain('mousemove');
        node.dispatchEvent(new MouseEvent('mouseenter', { bubbles }));
        expect(logMenu.events).to.not.contain('mouseenter');
        node.dispatchEvent(new MouseEvent('mouseleave', { bubbles }));
        expect(logMenu.events).to.not.contain('mouseleave');
        node.dispatchEvent(new MouseEvent('contextmenu', { bubbles }));
        expect(logMenu.events).to.not.contain('contextmenu');
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles }));
        expect(logMenu.events).to.not.contain('mousedown');
      });
    });

    describe('#onActivateRequest', () => {
      it('should focus the menu', done => {
        logMenu.open(0, 0);
        expect(document.activeElement).to.not.equal(logMenu.node);
        expect(logMenu.methods).to.not.contain('onActivateRequest');
        requestAnimationFrame(() => {
          expect(document.activeElement).to.equal(logMenu.node);
          expect(logMenu.methods).to.contain('onActivateRequest');
          done();
        });
      });
    });

    describe('#onUpdateRequest()', () => {
      it('should be called prior to opening', () => {
        expect(logMenu.methods).to.not.contain('onUpdateRequest');
        logMenu.open(0, 0);
        expect(logMenu.methods).to.contain('onUpdateRequest');
      });

      it('should collapse extra separators', () => {
        menu.addItem({ type: 'separator' });
        menu.addItem({ command: 'test' });
        menu.addItem({ type: 'separator' });
        menu.addItem({ type: 'separator' });
        menu.addItem({ type: 'submenu', submenu: new Menu({ commands }) });
        menu.addItem({ type: 'separator' });
        menu.open(0, 0);
        let elements = menu.node.querySelectorAll(
          '.lm-Menu-item[data-type="separator"'
        );
        expect(elements.length).to.equal(4);
        expect(elements[0].classList.contains('lm-mod-collapsed')).to.equal(
          true
        );
        expect(elements[1].classList.contains('lm-mod-collapsed')).to.equal(
          false
        );
        expect(elements[2].classList.contains('lm-mod-collapsed')).to.equal(
          true
        );
        expect(elements[3].classList.contains('lm-mod-collapsed')).to.equal(
          true
        );
      });
    });

    describe('#onCloseRequest()', () => {
      it('should reset the active index', () => {
        menu.addItem({ command: 'test' });
        menu.activeIndex = 0;
        menu.open(0, 0);
        menu.close();
        expect(menu.activeIndex).to.equal(-1);
      });

      it('should close any open child menu', () => {
        let submenu = new Menu({ commands });
        submenu.addItem({ command: 'test' });
        menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        menu.activateNextItem();
        menu.triggerActiveItem();
        expect(menu.childMenu).to.equal(submenu);
        expect(submenu.isAttached).equal(true);
        menu.close();
        expect(menu.childMenu).to.equal(null);
        expect(submenu.isAttached).equal(false);
      });

      it('should remove the menu from its parent and activate the parent', done => {
        let submenu = new Menu({ commands });
        submenu.addItem({ command: 'test' });
        menu.addItem({ type: 'submenu', submenu });
        menu.open(0, 0);
        menu.activateNextItem();
        menu.triggerActiveItem();
        expect(menu.childMenu).to.equal(submenu);
        expect(submenu.parentMenu).to.equal(menu);
        expect(submenu.isAttached).to.equal(true);
        submenu.close();
        expect(menu.childMenu).to.equal(null);
        expect(submenu.parentMenu).to.equal(null);
        expect(submenu.isAttached).to.equal(false);
        requestAnimationFrame(() => {
          expect(document.activeElement).to.equal(menu.node);
          done();
        });
      });

      it('should emit the `aboutToClose` signal if attached', () => {
        let called = false;
        menu.open(0, 0);
        menu.aboutToClose.connect((sender, args) => {
          expect(sender).to.equal(menu);
          expect(args).to.equal(undefined);
          called = true;
        });
        menu.close();
        expect(called).to.equal(true);
      });
    });

    describe('.IItem', () => {
      describe('#type', () => {
        it('should get the type of the menu item', () => {
          let item = menu.addItem({ type: 'separator' });
          expect(item.type).to.equal('separator');
        });

        it("should default to `'command'`", () => {
          let item = menu.addItem({});
          expect(item.type).to.equal('command');
        });
      });

      describe('#command', () => {
        it('should get the command to execute when the item is triggered', () => {
          let item = menu.addItem({ command: 'foo' });
          expect(item.command).to.equal('foo');
        });

        it('should default to an empty string', () => {
          let item = menu.addItem({});
          expect(item.command).to.equal('');
        });
      });

      describe('#args', () => {
        it('should get the arguments for the command', () => {
          let item = menu.addItem({ args: { foo: 1 } });
          expect(item.args).to.deep.equal({ foo: 1 });
        });

        it('should default to an empty object', () => {
          let item = menu.addItem({});
          expect(item.args).to.deep.equal({});
        });
      });

      describe('#submenu', () => {
        it('should get the submenu for the item', () => {
          let submenu = new Menu({ commands });
          let item = menu.addItem({ submenu });
          expect(item.submenu).to.equal(submenu);
        });

        it('should default to `null`', () => {
          let item = menu.addItem({});
          expect(item.submenu).to.equal(null);
        });
      });

      describe('#label', () => {
        it('should get the label of a command item for a `command` type', () => {
          let item = menu.addItem({ command: 'test' });
          expect(item.label).to.equal('Test Label');
        });

        it('should get the title label of a submenu item for a `submenu` type', () => {
          let submenu = new Menu({ commands });
          submenu.title.label = 'foo';
          let item = menu.addItem({ type: 'submenu', submenu });
          expect(item.label).to.equal('foo');
        });

        it('should default to an empty string', () => {
          let item = menu.addItem({});
          expect(item.label).to.equal('');
          item = menu.addItem({ type: 'separator' });
          expect(item.label).to.equal('');
        });
      });

      describe('#mnemonic', () => {
        it('should get the mnemonic index of a command item for a `command` type', () => {
          let item = menu.addItem({ command: 'test' });
          expect(item.mnemonic).to.equal(0);
        });

        it('should get the title mnemonic of a submenu item for a `submenu` type', () => {
          let submenu = new Menu({ commands });
          submenu.title.mnemonic = 1;
          let item = menu.addItem({ type: 'submenu', submenu });
          expect(item.mnemonic).to.equal(1);
        });

        it('should default to `-1`', () => {
          let item = menu.addItem({});
          expect(item.mnemonic).to.equal(-1);
          item = menu.addItem({ type: 'separator' });
          expect(item.mnemonic).to.equal(-1);
        });
      });

      describe('#icon', () => {
        it('should get the title icon of a submenu item for a `submenu` type', () => {
          let submenu = new Menu({ commands });
          submenu.title.iconClass = 'bar';
          let item = menu.addItem({ type: 'submenu', submenu });
          expect(item.iconClass).to.equal('bar');
        });

        it('should default to undefined', () => {
          let item = menu.addItem({});
          expect(item.icon).to.equal(undefined);
          item = menu.addItem({ type: 'separator' });
          expect(item.icon).to.equal(undefined);
        });
      });

      describe('#caption', () => {
        it('should get the caption of a command item for a `command` type', () => {
          let item = menu.addItem({ command: 'test' });
          expect(item.caption).to.equal('Test Caption');
        });

        it('should get the title caption of a submenu item for a `submenu` type', () => {
          let submenu = new Menu({ commands });
          submenu.title.caption = 'foo caption';
          let item = menu.addItem({ type: 'submenu', submenu });
          expect(item.caption).to.equal('foo caption');
        });

        it('should default to an empty string', () => {
          let item = menu.addItem({});
          expect(item.caption).to.equal('');
          item = menu.addItem({ type: 'separator' });
          expect(item.caption).to.equal('');
        });
      });

      describe('#className', () => {
        it('should get the extra class name of a command item for a `command` type', () => {
          let item = menu.addItem({ command: 'test' });
          expect(item.className).to.equal('testClass');
        });

        it('should get the title extra class name of a submenu item for a `submenu` type', () => {
          let submenu = new Menu({ commands });
          submenu.title.className = 'fooClass';
          let item = menu.addItem({ type: 'submenu', submenu });
          expect(item.className).to.equal('fooClass');
        });

        it('should default to an empty string', () => {
          let item = menu.addItem({});
          expect(item.className).to.equal('');
          item = menu.addItem({ type: 'separator' });
          expect(item.className).to.equal('');
        });
      });

      describe('#isEnabled', () => {
        it('should get whether the command is enabled for a `command` type', () => {
          let item = menu.addItem({ command: 'test-disabled' });
          expect(item.isEnabled).to.equal(false);
          item = menu.addItem({ type: 'command' });
          expect(item.isEnabled).to.equal(false);
          item = menu.addItem({ command: 'test' });
          expect(item.isEnabled).to.equal(true);
        });

        it('should get whether there is a submenu for a `submenu` type', () => {
          let submenu = new Menu({ commands });
          let item = menu.addItem({ type: 'submenu', submenu });
          expect(item.isEnabled).to.equal(true);
          item = menu.addItem({ type: 'submenu' });
          expect(item.isEnabled).to.equal(false);
        });

        it('should be `true` for a separator item', () => {
          let item = menu.addItem({ type: 'separator' });
          expect(item.isEnabled).to.equal(true);
        });
      });

      describe('#isToggled', () => {
        it('should get whether the command is toggled for a `command` type', () => {
          let item = menu.addItem({ command: 'test-toggled' });
          expect(item.isToggled).to.equal(true);
          item = menu.addItem({ command: 'test' });
          expect(item.isToggled).to.equal(false);
          item = menu.addItem({ type: 'command' });
          expect(item.isToggled).to.equal(false);
        });

        it('should be `false` for other item types', () => {
          let item = menu.addItem({ type: 'separator' });
          expect(item.isToggled).to.equal(false);
          item = menu.addItem({ type: 'submenu' });
          expect(item.isToggled).to.equal(false);
        });
      });

      describe('#isVisible', () => {
        it('should get whether the command is visible for a `command` type', () => {
          let item = menu.addItem({ command: 'test-hidden' });
          expect(item.isVisible).to.equal(false);
          item = menu.addItem({ command: 'test' });
          expect(item.isVisible).to.equal(true);
        });

        it('should get whether there is a submenu for a `submenu` type', () => {
          let submenu = new Menu({ commands });
          let item = menu.addItem({ type: 'submenu', submenu });
          expect(item.isVisible).to.equal(true);
          item = menu.addItem({ type: 'submenu' });
          expect(item.isVisible).to.equal(false);
        });

        it('should be `true` for a separator item', () => {
          let item = menu.addItem({ type: 'separator' });
          expect(item.isVisible).to.equal(true);
        });
      });

      describe('#keyBinding', () => {
        it('should get the key binding for the menu item', () => {
          let item = menu.addItem({ command: 'test' });
          expect(item.keyBinding!.keys).to.deep.equal(['Ctrl T']);
        });

        it('should be `null` for submenus and separators', () => {
          let item = menu.addItem({ type: 'separator' });
          expect(item.keyBinding).to.equal(null);
          item = menu.addItem({ type: 'submenu' });
          expect(item.keyBinding).to.equal(null);
        });
      });
    });

    describe('.Renderer', () => {
      let renderer = new Menu.Renderer();

      describe('#renderItem()', () => {
        it('should render an item node for the menu', () => {
          let item = menu.addItem({ command: 'test' });
          let vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-Menu-item')).to.equal(true);
          expect(node.classList.contains('lm-mod-hidden')).to.equal(false);
          expect(node.classList.contains('lm-mod-disabled')).to.equal(false);
          expect(node.classList.contains('lm-mod-toggled')).to.equal(false);
          expect(node.classList.contains('lm-mod-active')).to.equal(false);
          expect(node.classList.contains('lm-mod-collapsed')).to.equal(false);
          expect(node.getAttribute('data-command')).to.equal('test');
          expect(node.getAttribute('data-type')).to.equal('command');
          expect(node.querySelector('.lm-Menu-itemIcon')).to.not.equal(null);
          expect(node.querySelector('.lm-Menu-itemLabel')).to.not.equal(null);
          expect(node.querySelector('.lm-Menu-itemSubmenuIcon')).to.not.equal(
            null
          );
        });

        it('should handle the hidden item state', () => {
          let item = menu.addItem({ command: 'test-hidden' });
          let vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-mod-hidden')).to.equal(true);
        });

        it('should handle the disabled item state', () => {
          let item = menu.addItem({ command: 'test-disabled' });
          let vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-mod-disabled')).to.equal(true);
        });

        it('should handle the toggled item state', () => {
          let item = menu.addItem({ command: 'test-toggled' });
          let vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-mod-toggled')).to.equal(true);
        });

        it('should handle the active item state', () => {
          let item = menu.addItem({ command: 'test' });
          let vNode = renderer.renderItem({
            item,
            active: true,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-mod-active')).to.equal(true);
        });

        it('should handle the collapsed item state', () => {
          let item = menu.addItem({ command: 'test-collapsed' });
          let vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: true
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-mod-collapsed')).to.equal(true);
        });
      });

      describe('#renderIcon()', () => {
        it('should render the icon node for the menu', () => {
          let item = menu.addItem({ command: 'test' });
          let vNode = renderer.renderIcon({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-Menu-itemIcon')).to.equal(true);
          expect(node.classList.contains('foo')).to.equal(true);
        });
      });

      describe('#renderLabel()', () => {
        it('should render the label node for the menu', () => {
          let item = menu.addItem({ command: 'test' });
          let vNode = renderer.renderLabel({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          let span = '<span class="lm-Menu-itemMnemonic">T</span>est Label';
          expect(node.classList.contains('lm-Menu-itemLabel')).to.equal(true);
          expect(node.innerHTML).to.equal(span);
        });
      });

      describe('#renderShortcut()', () => {
        it('should render the shortcut node for the menu', () => {
          let item = menu.addItem({ command: 'test' });
          let vNode = renderer.renderShortcut({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-Menu-itemShortcut')).to.equal(
            true
          );
          if (Platform.IS_MAC) {
            expect(node.innerHTML).to.equal('\u2303 T');
          } else {
            expect(node.innerHTML).to.equal('Ctrl+T');
          }
        });
      });

      describe('#renderSubmenu()', () => {
        it('should render the submenu icon node for the menu', () => {
          let item = menu.addItem({ command: 'test' });
          let vNode = renderer.renderSubmenu({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(vNode);
          expect(node.classList.contains('lm-Menu-itemSubmenuIcon')).to.equal(
            true
          );
        });
      });

      describe('#createItemClass()', () => {
        it('should create the full class name for the item node', () => {
          let item = menu.addItem({ command: 'test' });

          let name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false
          });
          let expected = 'lm-Menu-item testClass';
          expect(name).to.equal(expected);

          name = renderer.createItemClass({
            item,
            active: true,
            collapsed: false
          });
          expected = 'lm-Menu-item lm-mod-active testClass';
          expect(name).to.equal(expected);

          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: true
          });
          expected = 'lm-Menu-item lm-mod-collapsed testClass';
          expect(name).to.equal(expected);

          item = menu.addItem({ command: 'test-disabled' });
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false
          });
          expected = 'lm-Menu-item lm-mod-disabled testClass';
          expect(name).to.equal(expected);

          item = menu.addItem({ command: 'test-toggled' });
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false
          });
          expected = 'lm-Menu-item lm-mod-toggled testClass';
          expect(name).to.equal(expected);

          item = menu.addItem({ command: 'test-hidden' });
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false
          });
          expected = 'lm-Menu-item lm-mod-hidden testClass';
          expect(name).to.equal(expected);

          let submenu = new Menu({ commands });
          submenu.title.className = 'fooClass';
          item = menu.addItem({ type: 'submenu', submenu });
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false
          });
          expected = 'lm-Menu-item fooClass';
          expect(name).to.equal(expected);
        });
      });

      describe('#createItemDataset()', () => {
        it('should create the item dataset', () => {
          let item = menu.addItem({ command: 'test' });
          let dataset = renderer.createItemDataset({
            item,
            active: false,
            collapsed: false
          });
          expect(dataset).to.deep.equal({ type: 'command', command: 'test' });

          item = menu.addItem({ type: 'separator' });
          dataset = renderer.createItemDataset({
            item,
            active: false,
            collapsed: false
          });
          expect(dataset).to.deep.equal({ type: 'separator' });

          let submenu = new Menu({ commands });
          item = menu.addItem({ type: 'submenu', submenu });
          dataset = renderer.createItemDataset({
            item,
            active: false,
            collapsed: false
          });
          expect(dataset).to.deep.equal({ type: 'submenu' });
        });
      });

      describe('#createIconClass()', () => {
        it('should create the icon class name', () => {
          let item = menu.addItem({ command: 'test' });
          let name = renderer.createIconClass({
            item,
            active: false,
            collapsed: false
          });
          let expected = 'lm-Menu-itemIcon foo';
          expect(name).to.equal(expected);

          item = menu.addItem({ type: 'separator' });
          name = renderer.createIconClass({
            item,
            active: false,
            collapsed: false
          });
          expected = 'lm-Menu-itemIcon';
          expect(name).to.equal(expected);

          let submenu = new Menu({ commands });
          submenu.title.iconClass = 'bar';
          item = menu.addItem({ type: 'submenu', submenu });
          name = renderer.createIconClass({
            item,
            active: false,
            collapsed: false
          });
          expected = 'lm-Menu-itemIcon bar';
          expect(name).to.equal(expected);
        });
      });

      describe('#formatLabel()', () => {
        it('should format the item label', () => {
          let item = menu.addItem({ command: 'test' });
          let child = renderer.formatLabel({
            item,
            active: false,
            collapsed: false
          });
          let node = VirtualDOM.realize(h.div(child));
          let span = '<span class="lm-Menu-itemMnemonic">T</span>est Label';
          expect(node.innerHTML).to.equal(span);

          item = menu.addItem({ type: 'separator' });
          child = renderer.formatLabel({
            item,
            active: false,
            collapsed: false
          });
          expect(child).to.equal('');

          let submenu = new Menu({ commands });
          submenu.title.label = 'Submenu Label';
          item = menu.addItem({ type: 'submenu', submenu });
          child = renderer.formatLabel({
            item,
            active: false,
            collapsed: false
          });
          expect(child).to.equal('Submenu Label');
        });
      });

      describe('#formatShortcut()', () => {
        it('should format the item shortcut', () => {
          let item = menu.addItem({ command: 'test' });
          let child = renderer.formatShortcut({
            item,
            active: false,
            collapsed: false
          });
          if (Platform.IS_MAC) {
            expect(child).to.equal('\u2303 T');
          } else {
            expect(child).to.equal('Ctrl+T');
          }
        });
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { JSONObject } from '@lumino/coreutils';

import { CommandRegistry } from '@lumino/commands';

import { DisposableSet } from '@lumino/disposable';

import { Message, MessageLoop } from '@lumino/messaging';

import { VirtualDOM, VirtualElement } from '@lumino/virtualdom';

import { Menu, MenuBar, Widget } from '@lumino/widgets';

class LogMenuBar extends MenuBar {
  events: string[] = [];

  methods: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.methods.push('onBeforeAttach');
  }

  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg);
    this.methods.push('onAfterDetach');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }
}

const bubbles = true;
const cancelable = true;

describe('@lumino/widgets', () => {
  const DEFAULT_CMD = 'menubar.spec.ts:defaultCmd';

  const disposables = new DisposableSet();

  let commands: CommandRegistry;

  function createMenuBar(): MenuBar {
    let bar = new MenuBar();
    for (let i = 0; i < 3; i++) {
      let menu = new Menu({ commands });
      let item = menu.addItem({ command: DEFAULT_CMD });
      menu.addItem(item);
      menu.title.label = `Menu${i}`;
      menu.title.mnemonic = 4;
      bar.addMenu(menu);
    }
    bar.activeIndex = 0;
    Widget.attach(bar, document.body);
    // Force an update.
    MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
    return bar;
  }

  before(() => {
    commands = new CommandRegistry();
    const iconRenderer = {
      render: (host: HTMLElement, options?: any) => {
        const renderNode = document.createElement('div');
        renderNode.className = 'foo';
        host.appendChild(renderNode);
      }
    };
    let cmd = commands.addCommand(DEFAULT_CMD, {
      execute: (args: JSONObject) => {
        return args;
      },
      label: 'LABEL',
      icon: iconRenderer,
      className: 'bar',
      isToggled: (args: JSONObject) => {
        return true;
      },
      mnemonic: 1
    });
    let kbd = commands.addKeyBinding({
      keys: ['A'],
      selector: '*',
      command: DEFAULT_CMD
    });
    disposables.add(cmd);
    disposables.add(kbd);
  });

  after(() => {
    disposables.dispose();
  });

  describe('MenuBar', () => {
    describe('#constructor()', () => {
      it('should take no arguments', () => {
        let bar = new MenuBar();
        expect(bar).to.be.an.instanceof(MenuBar);
        bar.dispose();
      });

      it('should take options for initializing the menu bar', () => {
        let renderer = new MenuBar.Renderer();
        let bar = new MenuBar({ renderer });
        expect(bar).to.be.an.instanceof(MenuBar);
        bar.dispose();
      });

      it('should add the `lm-MenuBar` class', () => {
        let bar = new MenuBar();
        expect(bar.hasClass('lm-MenuBar')).to.equal(true);
        bar.dispose();
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the menu bar', () => {
        let bar = new MenuBar();
        bar.addMenu(new Menu({ commands }));
        bar.dispose();
        expect(bar.isDisposed).to.equal(true);
        bar.dispose();
        expect(bar.isDisposed).to.equal(true);
      });
    });

    describe('#renderer', () => {
      it('should get the renderer for the menu bar', () => {
        let renderer = Object.create(MenuBar.defaultRenderer);
        let bar = new MenuBar({ renderer });
        expect(bar.renderer).to.equal(renderer);
        bar.dispose();
      });
    });

    describe('#childMenu', () => {
      it('should get the child menu of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        bar.openActiveMenu();
        expect(bar.childMenu).to.equal(menu);
        bar.dispose();
      });

      it('should be `null` if there is no open menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.childMenu).to.equal(null);
        bar.dispose();
      });
    });

    describe('#contentNode', () => {
      it('should get the menu content node', () => {
        let bar = new MenuBar();
        let content = bar.contentNode;
        expect(content.classList.contains('lm-MenuBar-content')).to.equal(true);
        bar.dispose();
      });
    });

    describe('#activeMenu', () => {
      it('should get the active menu of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.activeMenu).to.equal(menu);
        bar.dispose();
      });

      it('should be `null` if there is no active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        expect(bar.activeMenu).to.equal(null);
        bar.dispose();
      });

      it('should set the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeMenu = menu;
        expect(bar.activeMenu).to.equal(menu);
        bar.dispose();
      });

      it('should set to `null` if the menu is not in the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.activeMenu = menu;
        expect(bar.activeMenu).to.equal(null);
        bar.dispose();
      });
    });

    describe('#activeIndex', () => {
      it('should get the index of the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeMenu = menu;
        expect(bar.activeIndex).to.equal(0);
        bar.dispose();
      });

      it('should be `-1` if no menu is active', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        expect(bar.activeIndex).to.equal(-1);
        bar.dispose();
      });

      it('should set the index of the currently active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.activeIndex).to.equal(0);
        bar.dispose();
      });

      it('should set to `-1` if the index is out of range', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = -2;
        expect(bar.activeIndex).to.equal(-1);
        bar.activeIndex = 1;
        expect(bar.activeIndex).to.equal(-1);
        bar.dispose();
      });

      it('should add `lm-mod-active` to the active node', () => {
        let bar = createMenuBar();
        let node = bar.contentNode.firstChild as HTMLElement;
        expect(node.classList.contains('lm-mod-active')).to.equal(true);
        expect(bar.activeIndex).to.equal(0);
        bar.dispose();
      });
    });

    describe('#menus', () => {
      it('should get a read-only array of the menus in the menu bar', () => {
        let bar = new MenuBar();
        let menu0 = new Menu({ commands });
        let menu1 = new Menu({ commands });
        bar.addMenu(menu0);
        bar.addMenu(menu1);
        let menus = bar.menus;
        expect(menus.length).to.equal(2);
        expect(menus[0]).to.equal(menu0);
        expect(menus[1]).to.equal(menu1);
        bar.dispose();
      });
    });

    describe('#openActiveMenu()', () => {
      it('should open the active menu and activate its first menu item', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.activeMenu = menu;
        bar.openActiveMenu();
        expect(menu.isAttached).to.equal(true);
        expect(menu.activeItem!.command).to.equal(item.command);
        bar.dispose();
      });

      it('should be a no-op if there is no active menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.openActiveMenu();
        expect(menu.isAttached).to.equal(false);
        bar.dispose();
      });

      it('should be a no-op if the active menu is empty', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeMenu = menu;
        bar.openActiveMenu();
        expect(menu.isAttached).to.equal(false);
        bar.dispose();
      });
    });

    describe('#addMenu()', () => {
      it('should add a menu to the end of the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[1]).to.equal(menu);
        bar.dispose();
      });

      it('should move an existing menu to the end', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        let item = menu.addItem({ command: DEFAULT_CMD });
        menu.addItem(item);
        bar.addMenu(menu);
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[1]).to.equal(menu);
        bar.dispose();
      });
    });

    describe('#insertMenu()', () => {
      it('should insert a menu into the menu bar at the specified index', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.insertMenu(0, menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[0]).to.equal(menu);
        bar.dispose();
      });

      it('should clamp the index to the bounds of the menus', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.insertMenu(-1, menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[0]).to.equal(menu);

        menu = new Menu({ commands });
        bar.insertMenu(10, menu);
        expect(bar.menus.length).to.equal(3);
        expect(bar.menus[2]).to.equal(menu);

        bar.dispose();
      });

      it('should move an existing menu', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.insertMenu(0, menu);
        bar.insertMenu(10, menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[1]).to.equal(menu);
        bar.dispose();
      });

      it('should be a no-op if there is no effective move', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.insertMenu(0, menu);
        bar.insertMenu(0, menu);
        expect(bar.menus.length).to.equal(2);
        expect(bar.menus[0]).to.equal(menu);
        bar.dispose();
      });
    });

    describe('#removeMenu()', () => {
      it('should remove a menu from the menu bar by value', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        bar.removeMenu(menu);
        expect(bar.menus.length).to.equal(1);
        expect(bar.menus[0]).to.not.equal(menu);
        bar.dispose();
      });

      it('should return be a no-op if the menu is not in the menu bar', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        bar.removeMenu(menu);
        bar.removeMenu(menu);
        expect(bar.menus.length).to.equal(0);
        bar.dispose();
      });
    });

    describe('#removeMenuAt()', () => {
      it('should remove a menu from the menu bar by index', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        bar.removeMenuAt(1);
        expect(bar.menus.length).to.equal(1);
        expect(bar.menus[0]).to.not.equal(menu);
        bar.dispose();
      });

      it('should be a no-op if the index is out of range', () => {
        let bar = new MenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(menu);
        bar.removeMenuAt(1);
        bar.removeMenuAt(1);
        expect(bar.menus.length).to.equal(1);
        bar.dispose();
      });
    });

    describe('#clearMenus()', () => {
      it('should remove all menus from the menu bar', () => {
        let bar = new MenuBar();
        bar.addMenu(new Menu({ commands }));
        bar.addMenu(new Menu({ commands }));
        bar.clearMenus();
        expect(bar.menus).to.eql([]);
        bar.dispose();
      });

      it('should be a no-op if there are no menus', () => {
        let bar = new MenuBar();
        bar.clearMenus();
        expect(bar.menus).to.eql([]);
        bar.dispose();
      });
    });

    describe('#handleEvent()', () => {
      let bar: MenuBar;

      beforeEach(() => {
        bar = createMenuBar();
      });

      afterEach(() => {
        bar.dispose();
      });

      context('keydown', () => {
        it('should bail on Tab', () => {
          let event = new KeyboardEvent('keydown', { keyCode: 9 });
          bar.node.dispatchEvent(event);
          expect(event.defaultPrevented).to.equal(false);
        });

        it('should open the active menu on Enter', () => {
          let menu = bar.activeMenu!;
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 13
            })
          );
          expect(menu.isAttached).to.equal(true);
        });

        it('should open the active menu on Up Arrow', () => {
          let menu = bar.activeMenu!;
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 38
            })
          );
          expect(menu.isAttached).to.equal(true);
        });

        it('should open the active menu on Down Arrow', () => {
          let menu = bar.activeMenu!;
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 40
            })
          );
          expect(menu.isAttached).to.equal(true);
        });

        it('should close the active menu on Escape', () => {
          let menu = bar.activeMenu!;
          bar.openActiveMenu();
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 27
            })
          );
          expect(menu.isAttached).to.equal(false);
          expect(menu.activeIndex).to.equal(-1);
          expect(menu.node.contains(document.activeElement)).to.equal(false);
        });

        it('should activate the previous menu on Left Arrow', () => {
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 37
            })
          );
          expect(bar.activeIndex!).to.equal(2);
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 37
            })
          );
          expect(bar.activeIndex!).to.equal(1);
        });

        it('should activate the next menu on Right Arrow', () => {
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 39
            })
          );
          expect(bar.activeIndex!).to.equal(1);
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 39
            })
          );
          expect(bar.activeIndex!).to.equal(2);
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 39
            })
          );
          expect(bar.activeIndex!).to.equal(0);
        });

        it('should open the menu matching a mnemonic', () => {
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 97 // `1` key
            })
          );
          expect(bar.activeIndex!).to.equal(1);
          let menu = bar.activeMenu!;
          expect(menu.isAttached).to.equal(true);
        });

        it('should select the next menu matching by first letter', () => {
          bar.activeIndex = 1;
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 77 // `M` key
            })
          );
          expect(bar.activeIndex!).to.equal(1);
          let menu = bar.activeMenu!;
          expect(menu.isAttached).to.equal(false);
        });

        it('should select the first menu matching the mnemonic', () => {
          let menu = new Menu({ commands });
          menu.title.label = 'Test1';
          menu.title.mnemonic = 4;
          bar.addMenu(menu);
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 97 // `1` key
            })
          );
          expect(bar.activeIndex).to.equal(1);
          menu = bar.activeMenu!;
          expect(menu.isAttached).to.equal(false);
        });

        it('should select the only menu matching the first letter', () => {
          let menu = new Menu({ commands });
          menu.title.label = 'Test1';
          bar.addMenu(menu);
          bar.addMenu(new Menu({ commands }));
          bar.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 84 // `T` key
            })
          );
          expect(bar.activeIndex).to.equal(3);
          menu = bar.activeMenu!;
          expect(menu.isAttached).to.equal(false);
        });
      });

      context('mousedown', () => {
        it('should bail if the mouse press was not on the menu bar', () => {
          let event = new MouseEvent('mousedown', { bubbles, clientX: -10 });
          bar.node.dispatchEvent(event);
          expect(event.defaultPrevented).to.equal(false);
        });

        it('should close an open menu if the press was not on an item', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          bar.node.dispatchEvent(new MouseEvent('mousedown', { bubbles }));
          expect(bar.activeIndex).to.equal(-1);
          expect(menu.isAttached).to.equal(false);
        });

        it('should close an active menu', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName(
            'lm-MenuBar-item'
          )[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          bar.node.dispatchEvent(
            new MouseEvent('mousedown', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(false);
        });

        it('should open an active menu', () => {
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName(
            'lm-MenuBar-item'
          )[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          bar.node.dispatchEvent(
            new MouseEvent('mousedown', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });

        it('should not close an active menu if not a left mouse press', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName(
            'lm-MenuBar-item'
          )[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          bar.node.dispatchEvent(
            new MouseEvent('mousedown', {
              bubbles,
              button: 1,
              clientX: rect.left,
              clientY: rect.top
            })
          );
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });
      });

      context('mousemove', () => {
        it('should open a new menu if a menu is already open', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName(
            'lm-MenuBar-item'
          )[1] as HTMLElement;
          let rect = node.getBoundingClientRect();
          bar.node.dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles,
              clientX: rect.left + 1,
              clientY: rect.top
            })
          );
          expect(bar.activeIndex).to.equal(1);
          expect(menu.isAttached).to.equal(false);
          expect(bar.activeMenu!.isAttached).to.equal(true);
        });

        it('should be a no-op if the active index will not change', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          let node = bar.node.getElementsByClassName(
            'lm-MenuBar-item'
          )[0] as HTMLElement;
          let rect = node.getBoundingClientRect();
          bar.node.dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top + 1
            })
          );
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });

        it('should be a no-op if the mouse is not over an item and there is a menu open', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          bar.node.dispatchEvent(new MouseEvent('mousemove', { bubbles }));
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });
      });

      context('mouseleave', () => {
        it('should reset the active index if there is no open menu', () => {
          bar.node.dispatchEvent(new MouseEvent('mouseleave', { bubbles }));
          expect(bar.activeIndex).to.equal(-1);
        });

        it('should be a no-op if there is an open menu', () => {
          bar.openActiveMenu();
          let menu = bar.activeMenu!;
          bar.node.dispatchEvent(new MouseEvent('mouseleave', { bubbles }));
          expect(bar.activeIndex).to.equal(0);
          expect(menu.isAttached).to.equal(true);
        });
      });

      context('contextmenu', () => {
        it('should prevent default', () => {
          let event = new MouseEvent('contextmenu', { bubbles, cancelable });
          let cancelled = !bar.node.dispatchEvent(event);
          expect(cancelled).to.equal(true);
        });
      });
    });

    describe('#onBeforeAttach()', () => {
      it('should add event listeners', () => {
        let bar = new LogMenuBar();
        let node = bar.node;
        Widget.attach(bar, document.body);
        expect(bar.methods.indexOf('onBeforeAttach')).to.not.equal(-1);
        node.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
        expect(bar.events.indexOf('keydown')).to.not.equal(-1);
        node.dispatchEvent(new MouseEvent('mousedown', { bubbles }));
        expect(bar.events.indexOf('mousedown')).to.not.equal(-1);
        node.dispatchEvent(new MouseEvent('mousemove', { bubbles }));
        expect(bar.events.indexOf('mousemove')).to.not.equal(-1);
        node.dispatchEvent(new MouseEvent('mouseleave', { bubbles }));
        expect(bar.events.indexOf('mouseleave')).to.not.equal(-1);
        node.dispatchEvent(new MouseEvent('contextmenu', { bubbles }));
        expect(bar.events.indexOf('contextmenu')).to.not.equal(-1);
        bar.dispose();
      });
    });

    describe('#onAfterDetach()', () => {
      it('should remove event listeners', () => {
        let bar = new LogMenuBar();
        let node = bar.node;
        Widget.attach(bar, document.body);
        Widget.detach(bar);
        expect(bar.methods.indexOf('onBeforeAttach')).to.not.equal(-1);
        node.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
        expect(bar.events.indexOf('keydown')).to.equal(-1);
        node.dispatchEvent(new MouseEvent('mousedown', { bubbles }));
        expect(bar.events.indexOf('mousedown')).to.equal(-1);
        node.dispatchEvent(new MouseEvent('mousemove', { bubbles }));
        expect(bar.events.indexOf('mousemove')).to.equal(-1);
        node.dispatchEvent(new MouseEvent('mouseleave', { bubbles }));
        expect(bar.events.indexOf('mouseleave')).to.equal(-1);
        node.dispatchEvent(new MouseEvent('contextmenu', { bubbles }));
        expect(bar.events.indexOf('contextmenu')).to.equal(-1);
        bar.dispose();
      });
    });

    describe('#onActivateRequest()', () => {
      it('should be a no-op if not attached', () => {
        let bar = createMenuBar();
        Widget.detach(bar);
        MessageLoop.sendMessage(bar, Widget.Msg.ActivateRequest);
        expect(bar.node.contains(document.activeElement)).to.equal(false);
        bar.dispose();
      });

      it('should focus the node if attached', () => {
        let bar = createMenuBar();
        MessageLoop.sendMessage(bar, Widget.Msg.ActivateRequest);
        expect(bar.node.contains(document.activeElement)).to.equal(true);
        bar.dispose();
      });
    });

    describe('#onUpdateRequest()', () => {
      it('should be called when the title of a menu changes', done => {
        let bar = new LogMenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        bar.activeIndex = 0;
        expect(bar.methods.indexOf('onUpdateRequest')).to.equal(-1);
        menu.title.label = 'foo';
        expect(bar.methods.indexOf('onUpdateRequest')).to.equal(-1);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
          bar.dispose();
          done();
        });
      });

      it('should render the content', () => {
        let bar = new LogMenuBar();
        let menu = new Menu({ commands });
        bar.addMenu(menu);
        expect(bar.contentNode.children.length).to.equal(0);
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        let child = bar.contentNode.firstChild as HTMLElement;
        expect(child.className).to.contain('lm-MenuBar-item');
        bar.dispose();
      });
    });

    context('`menuRequested` signal', () => {
      it('should activate the next menu', () => {
        let bar = createMenuBar();
        bar.openActiveMenu();
        (bar.activeMenu!.menuRequested as any).emit('next');
        expect(bar.activeIndex).to.equal(1);
        bar.dispose();
      });

      it('should activate the previous menu', () => {
        let bar = createMenuBar();
        bar.openActiveMenu();
        (bar.activeMenu!.menuRequested as any).emit('previous');
        expect(bar.activeIndex).to.equal(2);
        bar.dispose();
      });

      it('should be a no-op if the sender is not the open menu', () => {
        let bar = createMenuBar();
        (bar.activeMenu!.menuRequested as any).emit('next');
        expect(bar.activeIndex).to.equal(0);
        bar.dispose();
      });
    });

    describe('.Renderer', () => {
      const renderer = new MenuBar.Renderer();
      let data: MenuBar.IRenderData;

      before(() => {
        let widget = new Widget();
        widget.title.label = 'foo';
        widget.title.iconClass = 'bar';
        widget.title.className = 'baz';
        widget.title.closable = true;
        data = {
          title: widget.title,
          active: true
        };
      });

      describe('#renderItem()', () => {
        it('should render the virtual element for a menu bar item', () => {
          let node = VirtualDOM.realize(renderer.renderItem(data));
          expect(node.classList.contains('lm-MenuBar-item')).to.equal(true);
          expect(
            node.getElementsByClassName('lm-MenuBar-itemIcon').length
          ).to.equal(1);
          expect(
            node.getElementsByClassName('lm-MenuBar-itemLabel').length
          ).to.equal(1);
        });
      });

      describe('#renderIcon()', () => {
        it('should render the icon element for a menu bar item', () => {
          let node = VirtualDOM.realize(renderer.renderIcon(data));
          expect(node.className).to.contain('lm-MenuBar-itemIcon');
          expect(node.className).to.contain('bar');
        });
      });

      describe('#renderLabel()', () => {
        it('should render the label element for a menu item', () => {
          let node = VirtualDOM.realize(renderer.renderLabel(data));
          expect(node.className).to.contain('lm-MenuBar-itemLabel');
          expect(node.textContent).to.equal('foo');
        });
      });

      describe('#createItemClass()', () => {
        it('should create the class name for the menu bar item', () => {
          let itemClass = renderer.createItemClass(data);
          expect(itemClass).to.contain('baz');
          expect(itemClass).to.contain('lm-mod-active');
        });
      });

      describe('#createIconClass()', () => {
        it('should create the class name for the menu bar item icon', () => {
          let iconClass = renderer.createIconClass(data);
          expect(iconClass).to.contain('lm-MenuBar-itemIcon');
          expect(iconClass).to.contain('bar');
        });
      });

      describe('#formatLabel()', () => {
        it('should format a label into HTML for display', () => {
          data.title.mnemonic = 1;
          let label = renderer.formatLabel(data);
          expect((label as any)[0]).to.equal('f');
          let node = VirtualDOM.realize((label as any)[1] as VirtualElement);
          expect(node.className).to.contain('lm-MenuBar-itemMnemonic');
          expect(node.textContent).to.equal('o');
          expect((label as any)[2]).to.equal('o');
        });

        it('should not add a mnemonic if the index is out of range', () => {
          data.title.mnemonic = -1;
          let label = renderer.formatLabel(data);
          expect(label).to.equal('foo');
        });
      });
    });

    describe('.defaultRenderer', () => {
      it('should be an instance of `Renderer`', () => {
        expect(MenuBar.defaultRenderer).to.be.an.instanceof(MenuBar.Renderer);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { Panel, PanelLayout, Widget } from '@lumino/widgets';

describe('@lumino/widgets', () => {
  describe('Panel', () => {
    describe('#constructor()', () => {
      it('should take no arguments', () => {
        let panel = new Panel();
        expect(panel).to.be.an.instanceof(Panel);
      });

      it('should accept options', () => {
        let layout = new PanelLayout();
        let panel = new Panel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should add the `lm-Panel` class', () => {
        let panel = new Panel();
        expect(panel.hasClass('lm-Panel')).to.equal(true);
      });
    });

    describe('#widgets', () => {
      it('should be a read-only array of widgets in the panel', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.widgets).to.deep.equal([widget]);
      });
    });

    describe('#addWidget()', () => {
      it('should add a widget to the end of the panel', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(new Widget());
        panel.addWidget(widget);
        expect(panel.widgets[1]).to.equal(widget);
      });

      it('should move an existing widget to the end', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(widget);
        panel.addWidget(new Widget());
        panel.addWidget(widget);
        expect(panel.widgets[1]).to.equal(widget);
      });
    });

    describe('#insertWidget()', () => {
      it('should insert a widget at the specified index', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(new Widget());
        panel.insertWidget(0, widget);
        expect(panel.widgets[0]).to.equal(widget);
      });

      it('should move an existing widget to the specified index', () => {
        let panel = new Panel();
        let widget = new Widget();
        panel.addWidget(new Widget());
        panel.addWidget(widget);
        panel.insertWidget(0, widget);
        expect(panel.widgets[0]).to.equal(widget);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { every } from '@lumino/algorithm';

import {
  IMessageHandler,
  IMessageHook,
  Message,
  MessageLoop
} from '@lumino/messaging';

import { PanelLayout, Widget } from '@lumino/widgets';

class LogHook implements IMessageHook {
  messages: string[] = [];

  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type);
    return true;
  }
}

class LogPanelLayout extends PanelLayout {
  methods: string[] = [];

  protected init(): void {
    super.init();
    this.methods.push('init');
  }

  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget);
    this.methods.push('attachWidget');
  }

  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget);
    this.methods.push('moveWidget');
  }

  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget);
    this.methods.push('detachWidget');
  }

  protected onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
  }
}

describe('@lumino/widgets', () => {
  describe('PanelLayout', () => {
    describe('#dispose()', () => {
      it('should dispose of the resources held by the widget', () => {
        let layout = new PanelLayout();
        let widgets = [new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        layout.dispose();
        expect(every(widgets, w => w.isDisposed)).to.equal(true);
      });
    });

    describe('#widgets', () => {
      it('should be a read-only sequence of widgets in the layout', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        let widgets = layout.widgets;
        expect(widgets.length).to.equal(1);
        expect(widgets[0]).to.equal(widget);
      });
    });

    describe('[Symbol.iterator]()', () => {
      it('should create an iterator over the widgets in the layout', () => {
        let layout = new PanelLayout();
        let widgets = [new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        widgets.forEach(w => {
          w.title.label = 'foo';
        });
        expect(every(layout, w => w.title.label === 'foo')).to.equal(true);
        let it1 = layout[Symbol.iterator](),
          it2 = layout[Symbol.iterator]();
        expect(it1).to.not.equal(it2);
      });
    });

    describe('#addWidget()', () => {
      it('should add a widget to the end of the layout', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        expect(layout.widgets[1]).to.equal(widget);
      });

      it('should move an existing widget to the end', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.addWidget(widget);
        expect(layout.widgets[1]).to.equal(widget);
      });
    });

    describe('#insertWidget()', () => {
      it('should insert a widget at the specified index', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.insertWidget(0, widget);
        expect(layout.widgets[0]).to.equal(widget);
      });

      it('should move an existing widget to the specified index', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.addWidget(widget);
        layout.insertWidget(0, widget);
        expect(layout.widgets[0]).to.equal(widget);
      });

      it('should clamp the index to the bounds of the widgets', () => {
        let layout = new PanelLayout();
        layout.addWidget(new Widget());
        let widget = new Widget();
        layout.insertWidget(-2, widget);
        expect(layout.widgets[0]).to.equal(widget);
        layout.insertWidget(10, widget);
        expect(layout.widgets[1]).to.equal(widget);
      });

      it('should be a no-op if the index does not change', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.insertWidget(0, widget);
        expect(layout.widgets[0]).to.equal(widget);
      });
    });

    describe('#removeWidget()', () => {
      it('should remove a widget by value', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.removeWidget(widget);
        expect(layout.widgets.length).to.equal(1);
        expect(layout.widgets[0]).to.not.equal(widget);
      });
    });

    describe('#removeWidgetAt()', () => {
      it('should remove a widget at a given index', () => {
        let layout = new PanelLayout();
        let widget = new Widget();
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.removeWidgetAt(0);
        expect(layout.widgets.length).to.equal(1);
        expect(layout.widgets[0]).to.not.equal(widget);
      });
    });

    describe('#init()', () => {
      it('should be invoked when the layout is installed on its parent', () => {
        let widget = new Widget();
        let layout = new LogPanelLayout();
        widget.layout = layout;
        expect(layout.methods).to.contain('init');
      });

      it('should attach all widgets to the DOM', () => {
        let parent = new Widget();
        Widget.attach(parent, document.body);
        let layout = new LogPanelLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        parent.layout = layout;
        expect(every(widgets, w => w.parent === parent)).to.equal(true);
        expect(every(widgets, w => w.isAttached)).to.equal(true);
        parent.dispose();
      });
    });

    describe('#attachWidget()', () => {
      it("should attach a widget to the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.insertWidget(0, widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(panel.node.children[0]).to.equal(widget.node);
        panel.dispose();
      });

      it('should send before/after attach messages if the parent is attached', () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        let hook = new LogHook();
        panel.layout = layout;
        MessageLoop.installMessageHook(widget, hook);
        Widget.attach(panel, document.body);
        layout.insertWidget(0, widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(hook.messages).to.contain('before-attach');
        expect(hook.messages).to.contain('after-attach');
        panel.dispose();
      });
    });

    describe('#moveWidget()', () => {
      it("should move a widget in the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.insertWidget(1, widget);
        expect(layout.methods).to.contain('moveWidget');
        expect(panel.node.children[1]).to.equal(widget.node);
        panel.dispose();
      });

      it('should send before/after detach/attach messages if the parent is attached', () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        panel.layout = layout;
        Widget.attach(panel, document.body);
        layout.addWidget(widget);
        layout.addWidget(new Widget());
        layout.insertWidget(1, widget);
        expect(layout.methods).to.contain('moveWidget');
        expect(hook.messages).to.contain('before-detach');
        expect(hook.messages).to.contain('after-detach');
        expect(hook.messages).to.contain('before-attach');
        expect(hook.messages).to.contain('after-attach');
        panel.dispose();
      });
    });

    describe('#detachWidget()', () => {
      it("should detach a widget from the parent's DOM node", () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.insertWidget(0, widget);
        expect(panel.node.children[0]).to.equal(widget.node);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        panel.dispose();
      });

      it('should send before/after detach message if the parent is attached', () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        panel.layout = layout;
        Widget.attach(panel, document.body);
        layout.insertWidget(0, widget);
        expect(panel.node.children[0]).to.equal(widget.node);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(hook.messages).to.contain('before-detach');
        expect(hook.messages).to.contain('after-detach');
        panel.dispose();
      });
    });

    describe('#onChildRemoved()', () => {
      it('should be called when a widget is removed from its parent', () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        widget.parent = null;
        expect(layout.methods).to.contain('onChildRemoved');
      });

      it('should remove the widget from the layout', () => {
        let panel = new Widget();
        let layout = new LogPanelLayout();
        let widget = new Widget();
        panel.layout = layout;
        layout.addWidget(widget);
        widget.parent = null;
        expect(layout.widgets.length).to.equal(0);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { every } from '@lumino/algorithm';

import {
  IMessageHandler,
  IMessageHook,
  Message,
  MessageLoop
} from '@lumino/messaging';

import { SplitLayout, Widget } from '@lumino/widgets';

const renderer: SplitLayout.IRenderer = {
  createHandle: () => document.createElement('div')
};

class LogSplitLayout extends SplitLayout {
  methods: string[] = [];

  protected init(): void {
    super.init();
    this.methods.push('init');
  }

  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget);
    this.methods.push('attachWidget');
  }

  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget);
    this.methods.push('moveWidget');
  }

  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget);
    this.methods.push('detachWidget');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg);
    this.methods.push('onChildShown');
  }

  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg);
    this.methods.push('onChildHidden');
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.methods.push('onResize');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg);
    this.methods.push('onFitRequest');
  }
}

class LogHook implements IMessageHook {
  messages: string[] = [];

  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type);
    return true;
  }
}

describe('@lumino/widgets', () => {
  describe('SplitLayout', () => {
    describe('#constructor()', () => {
      it('should accept a renderer', () => {
        let layout = new SplitLayout({ renderer });
        expect(layout).to.be.an.instanceof(SplitLayout);
      });
    });

    describe('#orientation', () => {
      it('should get the layout orientation for the split layout', () => {
        let layout = new SplitLayout({ renderer });
        expect(layout.orientation).to.equal('horizontal');
      });

      it('should set the layout orientation for the split layout', () => {
        let layout = new SplitLayout({ renderer });
        layout.orientation = 'vertical';
        expect(layout.orientation).to.equal('vertical');
      });

      it('should set the orientation attribute of the parent widget', () => {
        let parent = new Widget();
        let layout = new SplitLayout({ renderer });
        parent.layout = layout;
        layout.orientation = 'vertical';
        expect(parent.node.getAttribute('data-orientation')).to.equal(
          'vertical'
        );
        layout.orientation = 'horizontal';
        expect(parent.node.getAttribute('data-orientation')).to.equal(
          'horizontal'
        );
      });

      it('should post a fit request to the parent widget', done => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.orientation = 'vertical';
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', done => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.orientation = 'horizontal';
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });
    });

    describe('#spacing', () => {
      it('should get the inter-element spacing for the split layout', () => {
        let layout = new SplitLayout({ renderer });
        expect(layout.spacing).to.equal(4);
      });

      it('should set the inter-element spacing for the split layout', () => {
        let layout = new SplitLayout({ renderer });
        layout.spacing = 10;
        expect(layout.spacing).to.equal(10);
      });

      it('should post a fit rquest to the parent widget', done => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.spacing = 10;
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });

      it('should be a no-op if the value does not change', done => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        layout.spacing = 4;
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain('onFitRequest');
          done();
        });
      });
    });

    describe('#renderer', () => {
      it('should get the renderer for the layout', () => {
        let layout = new SplitLayout({ renderer });
        expect(layout.renderer).to.equal(renderer);
      });
    });

    describe('#handles', () => {
      it('should be a read-only sequence of the split handles in the layout', () => {
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        expect(every(layout.handles, h => h instanceof HTMLElement));
      });
    });

    describe('#relativeSizes()', () => {
      it('should get the current sizes of the widgets in the layout', () => {
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        let sizes = layout.relativeSizes();
        expect(sizes).to.deep.equal([1 / 3, 1 / 3, 1 / 3]);
        parent.dispose();
      });
    });

    describe('#setRelativeSizes()', () => {
      it('should set the desired sizes for the widgets in the panel', () => {
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        layout.setRelativeSizes([10, 10, 10]);
        let sizes = layout.relativeSizes();
        expect(sizes).to.deep.equal([10 / 30, 10 / 30, 10 / 30]);
        parent.dispose();
      });

      it('should ignore extra values', () => {
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        layout.setRelativeSizes([10, 15, 20, 20]);
        let sizes = layout.relativeSizes();
        expect(sizes).to.deep.equal([10 / 45, 15 / 45, 20 / 45]);
        parent.dispose();
      });
    });

    describe('#moveHandle()', () => {
      it('should set the offset position of a split handle', done => {
        let parent = new Widget();
        let layout = new SplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        widgets.forEach(w => {
          w.node.style.minHeight = '100px';
        });
        widgets.forEach(w => {
          w.node.style.minWidth = '100px';
        });
        parent.layout = layout;
        Widget.attach(parent, document.body);
        MessageLoop.flush();
        let handle = layout.handles[1];
        let left = handle.offsetLeft;
        layout.moveHandle(1, left + 20);
        requestAnimationFrame(() => {
          expect(handle.offsetLeft).to.not.equal(left);
          done();
        });
      });
    });

    describe('#init()', () => {
      it('should set the orientation attribute of the parent widget', () => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        expect(layout.methods).to.contain('init');
        expect(parent.node.getAttribute('data-orientation')).to.equal(
          'horizontal'
        );
      });

      it('should attach all widgets to the DOM', () => {
        let parent = new Widget();
        Widget.attach(parent, document.body);
        let layout = new LogSplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        parent.layout = layout;
        expect(every(widgets, w => w.parent === parent)).to.equal(true);
        expect(every(widgets, w => w.isAttached)).to.equal(true);
        parent.dispose();
      });
    });

    describe('#attachWidget()', () => {
      it("should attach a widget to the parent's DOM node", () => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        let widget = new Widget();
        layout.addWidget(widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(parent.node.contains(widget.node)).to.equal(true);
        expect(layout.handles.length).to.equal(1);
      });

      it('should send before/after attach messages if the parent is attached', () => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        parent.layout = layout;
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        expect(hook.messages).to.contain('before-attach');
        expect(hook.messages).to.contain('after-attach');
      });

      it('should post a layout request for the parent widget', done => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        let widget = new Widget();
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });
    });

    describe('#moveWidget()', () => {
      it("should move a widget in the parent's DOM node", () => {
        let layout = new LogSplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        let widget = widgets[0];
        let handle = layout.handles[0];
        layout.insertWidget(2, widget);
        expect(layout.methods).to.contain('moveWidget');
        expect(layout.handles[2]).to.equal(handle);
        expect(layout.widgets[2]).to.equal(widget);
      });

      it('should post a a layout request to the parent', done => {
        let layout = new LogSplitLayout({ renderer });
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        let widget = widgets[0];
        layout.insertWidget(2, widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });
    });

    describe('#detachWidget()', () => {
      it("should detach a widget from the parent's DOM node", () => {
        let layout = new LogSplitLayout({ renderer });
        let widget = new Widget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(parent.node.contains(widget.node)).to.equal(false);
        parent.dispose();
      });

      it('should send before/after detach message if the parent is attached', () => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(hook.messages).to.contain('before-detach');
        expect(hook.messages).to.contain('after-detach');
        parent.dispose();
      });

      it('should post a a layout request to the parent', done => {
        let layout = new LogSplitLayout({ renderer });
        let widget = new Widget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        layout.removeWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onAfterShow()', () => {
      it('should post an update to the parent', done => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        parent.hide();
        Widget.attach(parent, document.body);
        parent.show();
        expect(layout.methods).to.contain('onAfterShow');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onUpdateRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onAfterAttach()', () => {
      it('should post a layout request to the parent', done => {
        let layout = new LogSplitLayout({ renderer });
        let parent = new Widget();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        expect(layout.methods).to.contain('onAfterAttach');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onChildShown()', () => {
      it('should post a fit request to the parent', done => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets[0].hide();
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        widgets[0].show();
        expect(layout.methods).to.contain('onChildShown');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onChildHidden()', () => {
      it('should post a fit request to the parent', done => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        widgets[0].hide();
        expect(layout.methods).to.contain('onChildHidden');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onResize', () => {
      it('should be called when a resize event is sent to the parent', () => {
        let parent = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize);
        expect(layout.methods).to.contain('onResize');
        parent.dispose();
      });
    });

    describe('.getStretch()', () => {
      it('should get the split layout stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(SplitLayout.getStretch(widget)).to.equal(0);
      });
    });

    describe('.setStretch()', () => {
      it('should set the split layout stretch factor for the given widget', () => {
        let widget = new Widget();
        SplitLayout.setStretch(widget, 10);
        expect(SplitLayout.getStretch(widget)).to.equal(10);
      });

      it('should post a fit request to the parent', done => {
        let parent = new Widget();
        let widget = new Widget();
        let layout = new LogSplitLayout({ renderer });
        parent.layout = layout;
        layout.addWidget(widget);
        SplitLayout.setStretch(widget, 10);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { every } from '@lumino/algorithm';

import { MessageLoop } from '@lumino/messaging';

import { SplitLayout, SplitPanel, Widget } from '@lumino/widgets';

const bubbles = true;
const renderer: SplitPanel.IRenderer = {
  createHandle: () => document.createElement('div')
};

function dragHandle(panel: LogSplitPanel): void {
  MessageLoop.sendMessage(panel, Widget.Msg.UpdateRequest);
  let handle = panel.handles[0];
  let rect = handle.getBoundingClientRect();
  let args = { bubbles, clientX: rect.left + 1, clientY: rect.top + 1 };
  handle.dispatchEvent(new PointerEvent('pointerdown', args));
  args = { bubbles, clientX: rect.left + 10, clientY: rect.top + 1 };
  document.body.dispatchEvent(new PointerEvent('pointermove', args));
  document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles }));
}

class LogSplitPanel extends SplitPanel {
  events: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }
}

describe('@lumino/widgets', () => {
  describe('SplitPanel', () => {
    describe('#constructor()', () => {
      it('should accept no arguments', () => {
        let panel = new SplitPanel();
        expect(panel).to.be.an.instanceof(SplitPanel);
      });

      it('should accept options', () => {
        let panel = new SplitPanel({
          orientation: 'vertical',
          spacing: 5,
          renderer
        });
        expect(panel.orientation).to.equal('vertical');
        expect(panel.spacing).to.equal(5);
        expect(panel.renderer).to.equal(renderer);
      });

      it('should accept a layout option', () => {
        let layout = new SplitLayout({ renderer });
        let panel = new SplitPanel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should ignore other options if a layout is given', () => {
        let ignored = Object.create(renderer);
        let layout = new SplitLayout({ renderer });
        let panel = new SplitPanel({
          layout,
          orientation: 'vertical',
          spacing: 5,
          renderer: ignored
        });
        expect(panel.layout).to.equal(layout);
        expect(panel.orientation).to.equal('horizontal');
        expect(panel.spacing).to.equal(4);
        expect(panel.renderer).to.equal(renderer);
      });

      it('should add the `lm-SplitPanel` class', () => {
        let panel = new SplitPanel();
        expect(panel.hasClass('lm-SplitPanel')).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the panel', () => {
        let panel = new LogSplitPanel();
        let layout = panel.layout as SplitLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        Widget.attach(panel, document.body);
        let handle = layout.handles[0];
        handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
        expect(panel.events).to.contain('pointerdown');
        panel.node.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
        expect(panel.events).to.contain('keydown');
        let node = panel.node;
        panel.dispose();
        expect(every(widgets, w => w.isDisposed));
        node.dispatchEvent(new MouseEvent('contextmenu', { bubbles }));
        expect(panel.events).to.not.contain('contextmenu');
      });
    });

    describe('#orientation', () => {
      it('should get the layout orientation for the split panel', () => {
        let panel = new SplitPanel();
        expect(panel.orientation).to.equal('horizontal');
      });

      it('should set the layout orientation for the split panel', () => {
        let panel = new SplitPanel();
        panel.orientation = 'vertical';
        expect(panel.orientation).to.equal('vertical');
      });
    });

    describe('#spacing', () => {
      it('should default to `4`', () => {
        let panel = new SplitPanel();
        expect(panel.spacing).to.equal(4);
      });

      it('should set the spacing for the panel', () => {
        let panel = new SplitPanel();
        panel.spacing = 10;
        expect(panel.spacing).to.equal(10);
      });
    });

    describe('#renderer', () => {
      it('should get the renderer for the panel', () => {
        let panel = new SplitPanel({ renderer });
        expect(panel.renderer).to.equal(renderer);
      });
    });

    describe('#handleMoved', () => {
      it('should be emitted when a handle is moved by the user', done => {
        let panel = new LogSplitPanel();
        let widgets = [new Widget(), new Widget()];
        panel.orientation = 'horizontal';
        widgets.forEach(w => {
          w.node.style.minHeight = '40px';
          w.node.style.minWidth = '40px';
          panel.addWidget(w);
        });
        panel.setRelativeSizes([40, 80]);
        Widget.attach(panel, document.body);
        panel.handleMoved.connect((sender, _) => {
          expect(sender).to.equal(panel);
          done();
        });
        dragHandle(panel);
      });
    });

    describe('#handles', () => {
      it('should get the read-only sequence of the split handles in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        expect(panel.handles.length).to.equal(3);
      });
    });

    describe('#relativeSizes()', () => {
      it('should get the current sizes of the widgets in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        let sizes = panel.relativeSizes();
        expect(sizes).to.deep.equal([1 / 3, 1 / 3, 1 / 3]);
      });
    });

    describe('#setRelativeSizes()', () => {
      it('should set the desired sizes for the widgets in the panel', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.setRelativeSizes([10, 20, 30]);
        let sizes = panel.relativeSizes();
        expect(sizes).to.deep.equal([10 / 60, 20 / 60, 30 / 60]);
      });

      it('should ignore extra values', () => {
        let panel = new SplitPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.setRelativeSizes([10, 30, 40, 20]);
        let sizes = panel.relativeSizes();
        expect(sizes).to.deep.equal([10 / 80, 30 / 80, 40 / 80]);
      });
    });

    describe('#handleEvent()', () => {
      let panel: LogSplitPanel;
      let layout: SplitLayout;

      beforeEach(() => {
        panel = new LogSplitPanel();
        layout = panel.layout as SplitLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.setRelativeSizes([10, 10, 10, 20]);
        Widget.attach(panel, document.body);
        MessageLoop.flush();
      });

      afterEach(() => {
        panel.dispose();
      });

      context('pointerdown', () => {
        it('should attach other event listeners', () => {
          let handle = layout.handles[0];
          let body = document.body;
          handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
          expect(panel.events).to.contain('pointerdown');
          body.dispatchEvent(new PointerEvent('pointermove', { bubbles }));
          expect(panel.events).to.contain('pointermove');
          body.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
          expect(panel.events).to.contain('keydown');
          body.dispatchEvent(new MouseEvent('contextmenu', { bubbles }));
          expect(panel.events).to.contain('contextmenu');
          body.dispatchEvent(new PointerEvent('pointerup', { bubbles }));
          expect(panel.events).to.contain('pointerup');
        });

        it('should be a no-op if it is not the left button', () => {
          layout.handles[0].dispatchEvent(
            new PointerEvent('pointerdown', {
              bubbles,
              button: 1
            })
          );
          expect(panel.events).to.contain('pointerdown');
          document.body.dispatchEvent(
            new PointerEvent('pointermove', { bubbles })
          );
          expect(panel.events).to.not.contain('pointermove');
        });
      });

      context('pointermove', () => {
        it('should move the handle right', done => {
          let handle = layout.handles[1];
          let rect = handle.getBoundingClientRect();
          handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
          document.body.dispatchEvent(
            new PointerEvent('pointermove', {
              bubbles,
              clientX: rect.left + 10,
              clientY: rect.top
            })
          );
          requestAnimationFrame(() => {
            let newRect = handle.getBoundingClientRect();
            expect(newRect.left).to.not.equal(rect.left);
            done();
          });
        });

        it('should move the handle down', done => {
          panel.orientation = 'vertical';
          panel.widgets.forEach(w => {
            w.node.style.minHeight = '20px';
          });
          let handle = layout.handles[1];
          let rect = handle.getBoundingClientRect();
          handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
          document.body.dispatchEvent(
            new PointerEvent('pointermove', {
              bubbles,
              clientX: rect.left,
              clientY: rect.top - 2
            })
          );
          requestAnimationFrame(() => {
            let newRect = handle.getBoundingClientRect();
            expect(newRect.top).to.not.equal(rect.top);
            done();
          });
        });
      });

      context('pointerup', () => {
        it('should remove the event listeners', () => {
          let handle = layout.handles[0];
          let body = document.body;
          handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
          expect(panel.events).to.contain('pointerdown');
          body.dispatchEvent(new PointerEvent('pointerup', { bubbles }));
          expect(panel.events).to.contain('pointerup');
          body.dispatchEvent(new PointerEvent('pointermove', { bubbles }));
          expect(panel.events).to.not.contain('pointermove');
          body.dispatchEvent(new KeyboardEvent('keydown', { bubbles }));
          expect(panel.events).to.not.contain('keydown');
          body.dispatchEvent(new MouseEvent('contextmenu', { bubbles }));
          expect(panel.events).to.not.contain('contextmenu');
        });

        it('should be a no-op if not the left button', () => {
          let handle = layout.handles[0];
          let body = document.body;
          handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
          expect(panel.events).to.contain('pointerdown');
          body.dispatchEvent(
            new PointerEvent('pointerup', {
              bubbles,
              button: 1
            })
          );
          expect(panel.events).to.contain('pointerup');
          body.dispatchEvent(new PointerEvent('pointermove', { bubbles }));
          expect(panel.events).to.contain('pointermove');
        });
      });

      context('keydown', () => {
        it('should release the mouse if `Escape` is pressed', () => {
          let handle = layout.handles[0];
          handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
          panel.node.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles,
              keyCode: 27
            })
          );
          expect(panel.events).to.contain('keydown');
          panel.node.dispatchEvent(
            new PointerEvent('pointermove', { bubbles })
          );
          expect(panel.events).to.not.contain('pointermove');
        });
      });

      context('contextmenu', () => {
        it('should prevent events during drag', () => {
          let handle = layout.handles[0];
          handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
          let event = new MouseEvent('contextmenu', {
            bubbles,
            cancelable: true
          });
          let cancelled = !document.body.dispatchEvent(event);
          expect(cancelled).to.equal(true);
          expect(panel.events).to.contain('contextmenu');
        });
      });
    });

    describe('#onAfterAttach()', () => {
      it('should attach a pointerdown listener to the node', () => {
        let panel = new LogSplitPanel();
        Widget.attach(panel, document.body);
        panel.node.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
        expect(panel.events).to.contain('pointerdown');
        panel.dispose();
      });
    });

    describe('#onBeforeDetach()', () => {
      it('should remove all listeners', () => {
        let panel = new LogSplitPanel();
        Widget.attach(panel, document.body);
        panel.node.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
        expect(panel.events).to.contain('pointerdown');
        Widget.detach(panel);
        panel.events = [];
        panel.node.dispatchEvent(new PointerEvent('pointerdown', { bubbles }));
        expect(panel.events).to.not.contain('pointerdown');
        document.body.dispatchEvent(new KeyboardEvent('keyup', { bubbles }));
        expect(panel.events).to.not.contain('keyup');
      });
    });

    describe('#onChildAdded()', () => {
      it('should add a class to the child widget', () => {
        let panel = new SplitPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(widget.hasClass('lm-SplitPanel-child')).to.equal(true);
      });
    });

    describe('#onChildRemoved()', () => {
      it('should remove a class to the child widget', () => {
        let panel = new SplitPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(widget.hasClass('lm-SplitPanel-child')).to.equal(false);
      });
    });

    describe('.Renderer()', () => {
      describe('#createHandle()', () => {
        it('should create a new handle node', () => {
          let renderer = new SplitPanel.Renderer();
          let node1 = renderer.createHandle();
          let node2 = renderer.createHandle();
          expect(node1).to.be.an.instanceof(HTMLElement);
          expect(node2).to.be.an.instanceof(HTMLElement);
          expect(node1).to.not.equal(node2);
        });

        it('should add the "lm-SplitPanel-handle" class', () => {
          let renderer = new SplitPanel.Renderer();
          let node = renderer.createHandle();
          expect(node.classList.contains('lm-SplitPanel-handle')).to.equal(
            true
          );
        });
      });
    });

    describe('.defaultRenderer', () => {
      it('should be an instance of `Renderer`', () => {
        expect(SplitPanel.defaultRenderer).to.be.an.instanceof(
          SplitPanel.Renderer
        );
      });
    });

    describe('.getStretch()', () => {
      it('should get the split panel stretch factor for the given widget', () => {
        let widget = new Widget();
        expect(SplitPanel.getStretch(widget)).to.equal(0);
      });
    });

    describe('.setStretch()', () => {
      it('should set the split panel stretch factor for the given widget', () => {
        let widget = new Widget();
        SplitPanel.setStretch(widget, 10);
        expect(SplitPanel.getStretch(widget)).to.equal(10);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import {
  IMessageHandler,
  IMessageHook,
  Message,
  MessageLoop
} from '@lumino/messaging';

import { StackedLayout, Widget } from '@lumino/widgets';

class LogHook implements IMessageHook {
  messages: string[] = [];

  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type);
    return true;
  }
}

class LogStackedLayout extends StackedLayout {
  methods: string[] = [];

  protected init(): void {
    super.init();
    this.methods.push('init');
  }

  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget);
    this.methods.push('attachWidget');
  }

  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget);
    this.methods.push('moveWidget');
  }

  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget);
    this.methods.push('detachWidget');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg);
    this.methods.push('onChildShown');
  }

  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg);
    this.methods.push('onChildHidden');
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.methods.push('onResize');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg);
    this.methods.push('onFitRequest');
  }
}

describe('@lumino/widgets', () => {
  describe('StackedLayout', () => {
    describe('#attachWidget()', () => {
      it("should attach a widget to the parent's DOM node", () => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        expect(layout.methods).to.contain('attachWidget');
        expect(parent.node.contains(widget.node)).to.equal(true);
      });

      it('should send before/after attach messages if the parent is attached', () => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        parent.layout = layout;
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        expect(hook.messages).to.contain('before-attach');
        expect(hook.messages).to.contain('after-attach');
      });

      it('should post a fit request for the parent widget', done => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget = new Widget();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        layout.addWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          done();
        });
      });
    });

    describe('#moveWidget()', () => {
      it("should move a widget in the parent's DOM node", () => {
        let layout = new LogStackedLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        layout.insertWidget(2, widgets[0]);
        expect(layout.methods).to.contain('moveWidget');
        expect(layout.widgets[2]).to.equal(widgets[0]);
      });

      it('should post an update request to the parent', done => {
        let layout = new LogStackedLayout();
        let widgets = [new Widget(), new Widget(), new Widget()];
        let parent = new Widget();
        parent.layout = layout;
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        layout.insertWidget(2, widgets[0]);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onUpdateRequest');
          done();
        });
      });
    });

    describe('#detachWidget()', () => {
      it("should detach a widget from the parent's DOM node", () => {
        let layout = new LogStackedLayout();
        let widget = new Widget();
        let parent = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(parent.node.contains(widget.node)).to.equal(false);
        parent.dispose();
      });

      it('should send before/after detach message if the parent is attached', () => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget = new Widget();
        let hook = new LogHook();
        MessageLoop.installMessageHook(widget, hook);
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        layout.removeWidget(widget);
        expect(layout.methods).to.contain('detachWidget');
        expect(hook.messages).to.contain('before-detach');
        expect(hook.messages).to.contain('after-detach');
        parent.dispose();
      });

      it('should post a a layout request to the parent', done => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget = new Widget();
        parent.layout = layout;
        layout.addWidget(widget);
        Widget.attach(parent, document.body);
        layout.removeWidget(widget);
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });

      it('should reset the z-index for the widget', done => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        let widget1 = new Widget();
        let widget2 = new Widget();
        parent.layout = layout;
        layout.addWidget(widget1);
        layout.addWidget(widget2);
        Widget.attach(parent, document.body);
        requestAnimationFrame(() => {
          // string casts are required for IE
          expect(`${widget1.node.style.zIndex}`).to.equal('0');
          expect(`${widget2.node.style.zIndex}`).to.equal('1');
          layout.removeWidget(widget1);
          expect(`${widget1.node.style.zIndex}`).to.equal('');
          expect(`${widget2.node.style.zIndex}`).to.equal('1');
          layout.removeWidget(widget2);
          expect(`${widget2.node.style.zIndex}`).to.equal('');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onAfterShow()', () => {
      it('should post an update to the parent', done => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        parent.layout = layout;
        parent.hide();
        Widget.attach(parent, document.body);
        parent.show();
        expect(layout.methods).to.contain('onAfterShow');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onUpdateRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onAfterAttach()', () => {
      it('should post a layout request to the parent', done => {
        let layout = new LogStackedLayout();
        let parent = new Widget();
        parent.layout = layout;
        Widget.attach(parent, document.body);
        expect(layout.methods).to.contain('onAfterAttach');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onChildShown()', () => {
      it('should post or send a fit request to the parent', done => {
        let parent = new Widget();
        let layout = new LogStackedLayout();
        parent.layout = layout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets[0].hide();
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        widgets[0].show();
        expect(layout.methods).to.contain('onChildShown');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });

    describe('#onChildHidden()', () => {
      it('should post or send a fit request to the parent', done => {
        let parent = new Widget();
        let layout = new LogStackedLayout();
        parent.layout = layout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          layout.addWidget(w);
        });
        Widget.attach(parent, document.body);
        widgets[0].hide();
        expect(layout.methods).to.contain('onChildHidden');
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain('onFitRequest');
          parent.dispose();
          done();
        });
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { StackedLayout, StackedPanel, Widget } from '@lumino/widgets';

describe('@lumino/widgets', () => {
  describe('StackedPanel', () => {
    describe('#constructor()', () => {
      it('should take no arguments', () => {
        let panel = new StackedPanel();
        expect(panel).to.be.an.instanceof(StackedPanel);
      });

      it('should take options', () => {
        let layout = new StackedLayout();
        let panel = new StackedPanel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should add the `lm-StackedPanel` class', () => {
        let panel = new StackedPanel();
        expect(panel.hasClass('lm-StackedPanel')).to.equal(true);
      });
    });

    describe('hiddenMode', () => {
      let panel: StackedPanel;
      let widgets: Widget[] = [];

      beforeEach(() => {
        panel = new StackedPanel();

        // Create two stacked widgets
        widgets.push(new Widget());
        panel.addWidget(widgets[0]);
        widgets.push(new Widget());
        panel.addWidget(widgets[1]);
      });

      afterEach(() => {
        panel.dispose();
      });

      it("should be 'display' mode by default", () => {
        expect(panel.hiddenMode).to.equal(Widget.HiddenMode.Display);
      });

      it("should switch to 'scale'", () => {
        panel.hiddenMode = Widget.HiddenMode.Scale;

        expect(widgets[0].hiddenMode).to.equal(Widget.HiddenMode.Scale);
        expect(widgets[1].hiddenMode).to.equal(Widget.HiddenMode.Scale);
      });

      it("should switch to 'display'", () => {
        widgets[0].hiddenMode = Widget.HiddenMode.Scale;

        panel.hiddenMode = Widget.HiddenMode.Scale;
        panel.hiddenMode = Widget.HiddenMode.Display;

        expect(widgets[0].hiddenMode).to.equal(Widget.HiddenMode.Display);
        expect(widgets[1].hiddenMode).to.equal(Widget.HiddenMode.Display);
      });

      it("should not set 'scale' if only one widget", () => {
        panel.layout!.removeWidget(widgets[1]);

        panel.hiddenMode = Widget.HiddenMode.Scale;

        expect(widgets[0].hiddenMode).to.equal(Widget.HiddenMode.Display);
      });
    });

    describe('#widgetRemoved', () => {
      it('should be emitted when a widget is removed from a stacked panel', () => {
        let panel = new StackedPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        panel.widgetRemoved.connect((sender, args) => {
          expect(sender).to.equal(panel);
          expect(args).to.equal(widget);
        });
        widget.parent = null;
      });
    });

    describe('#onChildAdded()', () => {
      it('should add a class to the child widget', () => {
        let panel = new StackedPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(widget.hasClass('lm-StackedPanel-child')).to.equal(true);
      });
    });

    describe('#onChildRemoved()', () => {
      it('should remove a class to the child widget', () => {
        let panel = new StackedPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.parent = null;
        expect(widget.hasClass('lm-StackedPanel-child')).to.equal(false);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { range } from '@lumino/algorithm';

import { Message, MessageLoop } from '@lumino/messaging';

import { TabBar, Title, Widget } from '@lumino/widgets';

import { VirtualDOM, VirtualElement } from '@lumino/virtualdom';

class LogTabBar extends TabBar<Widget> {
  events: string[] = [];

  methods: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.methods.push('onBeforeAttach');
  }

  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg);
    this.methods.push('onAfterDetach');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }
}

function populateBar(bar: TabBar<Widget>): void {
  // Add some tabs with labels.
  for (const i of range(3)) {
    let widget = new Widget();
    widget.title.label = `Test - ${i}`;
    widget.title.closable = true;
    bar.addTab(widget.title);
  }
  // Force the tabs to render
  MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
  // Add the close icon content.
  for (const i of range(3)) {
    let tab = bar.contentNode.children[i];
    let icon = tab.querySelector(bar.renderer.closeIconSelector);
    icon!.textContent = 'X';
  }
}

type Action = 'pointerdown' | 'pointermove' | 'pointerup';

type Direction = 'left' | 'right' | 'up' | 'down';

function startDrag(
  bar: LogTabBar,
  index = 0,
  direction: Direction = 'right'
): void {
  bar.tabsMovable = true;
  let tab = bar.contentNode.children[index] as HTMLElement;
  bar.currentIndex = index;
  // Force an update.
  MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
  let called = false;
  bar.tabDetachRequested.connect((sender, args) => {
    called = true;
  });
  let rect = bar.contentNode.getBoundingClientRect();
  let args: any;
  switch (direction) {
    case 'left':
      args = { clientX: rect.left - 200, clientY: rect.top };
      break;
    case 'up':
      args = { clientX: rect.left, clientY: rect.top - 200 };
      break;
    case 'down':
      args = { clientX: rect.left, clientY: rect.bottom + 200 };
      break;
    default:
      args = { clientX: rect.right + 200, clientY: rect.top };
      break;
  }
  simulateOnNode(tab, 'pointerdown');
  document.body.dispatchEvent(
    new PointerEvent('pointermove', {
      ...args,
      cancelable: true
    })
  );
  expect(called).to.equal(true);
  bar.events = [];
}

function simulateOnNode(node: Element, action: Action): void {
  let rect = node.getBoundingClientRect();
  node.dispatchEvent(
    new PointerEvent(action, {
      clientX: rect.left + 1,
      clientY: rect.top,
      cancelable: true,
      bubbles: true
    })
  );
}

describe('@lumino/widgets', () => {
  describe('TabBar', () => {
    let bar: LogTabBar;

    beforeEach(() => {
      bar = new LogTabBar();
      Widget.attach(bar, document.body);
    });

    afterEach(() => {
      bar.dispose();
    });

    describe('#constructor()', () => {
      it('should take no arguments', () => {
        let newBar = new TabBar<Widget>();
        expect(newBar).to.be.an.instanceof(TabBar);
      });

      it('should take an options argument', () => {
        let renderer = new TabBar.Renderer();
        let newBar = new TabBar<Widget>({
          orientation: 'horizontal',
          tabsMovable: true,
          allowDeselect: true,
          addButtonEnabled: true,
          insertBehavior: 'select-tab',
          removeBehavior: 'select-previous-tab',
          renderer
        });
        expect(newBar).to.be.an.instanceof(TabBar);
        expect(newBar.tabsMovable).to.equal(true);
        expect(newBar.renderer).to.equal(renderer);
        expect(newBar.addButtonEnabled).to.equal(true);
      });

      it('should add the `lm-TabBar` class', () => {
        let newBar = new TabBar<Widget>();
        expect(newBar.hasClass('lm-TabBar')).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the widget', () => {
        bar.dispose();
        expect(bar.isDisposed).to.equal(true);
        bar.dispose();
        expect(bar.isDisposed).to.equal(true);
      });
    });

    describe('#currentChanged', () => {
      it('should be emitted when the current tab is changed', () => {
        populateBar(bar);
        let called = false;
        let titles = bar.titles;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.previousIndex).to.equal(0);
          expect(args.previousTitle).to.equal(titles[0]);
          expect(args.currentIndex).to.equal(1);
          expect(args.currentTitle).to.equal(titles[1]);
          called = true;
        });
        bar.currentTitle = titles[1];
        expect(called).to.equal(true);
      });

      it('should not be emitted when another tab is inserted', () => {
        populateBar(bar);
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          called = true;
        });
        let widget = new Widget();
        bar.insertTab(0, widget.title);
        expect(called).to.equal(false);
      });

      it('should not be emitted when another tab is removed', () => {
        populateBar(bar);
        let called = false;
        bar.currentIndex = 1;
        bar.currentChanged.connect((sender, args) => {
          called = true;
        });
        bar.removeTab(bar.titles[0]);
        expect(called).to.equal(false);
      });

      it('should not be emitted when the current tab is moved', () => {
        populateBar(bar);
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          called = true;
        });
        bar.insertTab(2, bar.titles[0]);
        expect(called).to.equal(false);
      });
    });

    describe('#tabMoved', () => {
      it('should be emitted when a tab is moved right by the user', done => {
        populateBar(bar);
        let titles = bar.titles.slice();
        bar.tabMoved.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.fromIndex).to.equal(0);
          expect(args.toIndex).to.equal(2);
          expect(args.title).to.equal(titles[0]);
          done();
        });
        startDrag(bar);
        document.body.dispatchEvent(
          new PointerEvent('pointerup', {
            cancelable: true
          })
        );
      });

      it('should be emitted when a tab is moved left by the user', done => {
        populateBar(bar);
        let titles = bar.titles.slice();
        bar.tabMoved.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.fromIndex).to.equal(2);
          expect(args.toIndex).to.equal(0);
          expect(args.title).to.equal(titles[2]);
          done();
        });
        startDrag(bar, 2, 'left');
        document.body.dispatchEvent(new PointerEvent('pointerup'));
      });

      it('should not be emitted when a tab is moved programmatically', () => {
        populateBar(bar);
        let called = false;
        bar.tabMoved.connect((sender, args) => {
          called = true;
        });
        bar.insertTab(2, bar.titles[0]);
        expect(called).to.equal(false);
      });
    });

    describe('#tabActivateRequested', () => {
      let tab: HTMLElement;

      beforeEach(() => {
        populateBar(bar);
        bar.tabsMovable = false;
        tab = bar.contentNode.getElementsByClassName(
          'lm-TabBar-tab'
        )[2] as HTMLElement;
      });

      it('should be emitted when a tab is left pressed by the user', () => {
        let called = false;
        bar.currentIndex = 0;
        // Force an update.
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        bar.tabActivateRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(2);
          expect(args.title).to.equal(bar.titles[2]);
          called = true;
        });
        simulateOnNode(tab, 'pointerdown');
        expect(called).to.equal(true);
      });

      it('should make the tab current and emit the `currentChanged` signal', () => {
        let called = 0;
        bar.currentIndex = 1;
        // Force an update.
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        bar.tabActivateRequested.connect(() => {
          called++;
        });
        bar.currentChanged.connect(() => {
          called++;
        });
        simulateOnNode(tab, 'pointerdown');
        expect(bar.currentIndex).to.equal(2);
        expect(called).to.equal(2);
      });

      it('should emit even if the pressed tab is the current tab', () => {
        let called = false;
        bar.currentIndex = 2;
        // Force an update.
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        bar.tabActivateRequested.connect(() => {
          called = true;
        });
        simulateOnNode(tab, 'pointerdown');
        expect(bar.currentIndex).to.equal(2);
        expect(called).to.equal(true);
      });
    });

    describe('#tabCloseRequested', () => {
      let tab: Element;
      let closeIcon: Element;

      beforeEach(() => {
        populateBar(bar);
        bar.currentIndex = 0;
        tab = bar.contentNode.children[0];
        closeIcon = tab.querySelector(bar.renderer.closeIconSelector)!;
      });

      it('should be emitted when a tab close icon is left clicked', () => {
        let called = false;
        let rect = closeIcon.getBoundingClientRect();
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        closeIcon.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
            bubbles: true
          })
        );
        closeIcon.dispatchEvent(
          new PointerEvent('pointerup', {
            clientX: rect.left,
            clientY: rect.top,
            button: 0
          })
        );
        expect(called).to.equal(true);
      });

      it('should be emitted when a tab is middle clicked', () => {
        let called = false;
        let rect = tab.getBoundingClientRect();
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        tab.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: rect.left,
            clientY: rect.top,
            button: 1,
            bubbles: true
          })
        );
        tab.dispatchEvent(
          new PointerEvent('pointerup', {
            clientX: rect.left,
            clientY: rect.top,
            button: 1
          })
        );
        expect(called).to.equal(true);
      });

      it('should not be emitted if the tab title is not `closable`', () => {
        let called = false;
        let title = bar.titles[0];
        title.closable = false;
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          called = true;
        });
        let rect1 = closeIcon.getBoundingClientRect();
        let rect2 = tab.getBoundingClientRect();
        closeIcon.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: rect1.left,
            clientY: rect1.top,
            button: 0,
            cancelable: true
          })
        );
        closeIcon.dispatchEvent(
          new PointerEvent('pointerup', {
            clientX: rect1.left,
            clientY: rect1.top,
            button: 0,
            cancelable: true
          })
        );
        tab.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: rect2.left,
            clientY: rect2.top,
            button: 1,
            cancelable: true
          })
        );
        tab.dispatchEvent(
          new PointerEvent('pointereup', {
            clientX: rect2.left,
            clientY: rect2.top,
            button: 1,
            cancelable: true
          })
        );
        expect(called).to.equal(false);
      });
    });

    describe('#addRequested', () => {
      let addButton: Element;

      beforeEach(() => {
        populateBar(bar);
        bar.currentIndex = 0;
        addButton = bar.addButtonNode;
      });

      it('should be emitted when the add button is clicked', () => {
        bar.addButtonEnabled = true;
        let called = false;
        let rect = addButton.getBoundingClientRect();
        bar.addRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args).to.equal(undefined);
          called = true;
        });
        addButton.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
            bubbles: true
          })
        );
        addButton.dispatchEvent(
          new PointerEvent('pointerup', {
            clientX: rect.left,
            clientY: rect.top,
            button: 0
          })
        );
        expect(called).to.equal(true);
      });

      it('should not be emitted if addButtonEnabled is `false`', () => {
        bar.addButtonEnabled = false;
        let called = false;
        let rect = addButton.getBoundingClientRect();
        bar.addRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args).to.equal(undefined);
          called = true;
        });
        addButton.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
            cancelable: true
          })
        );
        addButton.dispatchEvent(
          new PointerEvent('pointerup', {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
            cancelable: true
          })
        );
        expect(called).to.equal(false);
      });
    });

    describe('#tabDetachRequested', () => {
      let tab: HTMLElement;

      beforeEach(() => {
        populateBar(bar);
        bar.tabsMovable = true;
        tab = bar.contentNode.children[bar.currentIndex] as HTMLElement;
      });

      it('should be emitted when a tab is dragged beyond the detach threshold', () => {
        simulateOnNode(tab, 'pointerdown');
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.index).to.equal(0);
          expect(args.title).to.equal(bar.titles[0]);
          expect(args.clientX).to.equal(rect.right + 200);
          expect(args.clientY).to.equal(rect.top);
          called = true;
        });
        let rect = bar.contentNode.getBoundingClientRect();
        document.body.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: rect.right + 200,
            clientY: rect.top,
            cancelable: true
          })
        );
        expect(called).to.equal(true);
      });

      it('should be handled by calling `releaseMouse` and removing the tab', () => {
        simulateOnNode(tab, 'pointerdown');
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse();
          bar.removeTabAt(args.index);
          called = true;
        });
        let rect = bar.contentNode.getBoundingClientRect();
        document.body.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: rect.right + 200,
            clientY: rect.top,
            cancelable: true
          })
        );
        expect(called).to.equal(true);
      });

      it('should only be emitted once per drag cycle', () => {
        simulateOnNode(tab, 'pointerdown');
        let called = 0;
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse();
          bar.removeTabAt(args.index);
          called++;
        });
        let rect = bar.contentNode.getBoundingClientRect();
        document.body.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: rect.right + 200,
            clientY: rect.top,
            cancelable: true
          })
        );
        expect(called).to.equal(1);
        document.body.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: rect.right + 201,
            clientY: rect.top,
            cancelable: true
          })
        );
        expect(called).to.equal(1);
      });

      it('should add the `lm-mod-dragging` class to the tab and the bar', () => {
        simulateOnNode(tab, 'pointerdown');
        let called = false;
        bar.tabDetachRequested.connect((sender, args) => {
          expect(tab.classList.contains('lm-mod-dragging')).to.equal(true);
          expect(bar.hasClass('lm-mod-dragging')).to.equal(true);
          called = true;
        });
        let rect = bar.contentNode.getBoundingClientRect();
        document.body.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: rect.right + 200,
            clientY: rect.top,
            cancelable: true
          })
        );
        expect(called).to.equal(true);
      });
    });

    describe('#renderer', () => {
      it('should be the tab bar renderer', () => {
        let renderer = Object.create(TabBar.defaultRenderer);
        let bar = new TabBar<Widget>({ renderer });
        expect(bar.renderer).to.equal(renderer);
      });

      it('should default to the default renderer', () => {
        let bar = new TabBar<Widget>();
        expect(bar.renderer).to.equal(TabBar.defaultRenderer);
      });
    });

    describe('#tabsMovable', () => {
      it('should get whether the tabs are movable by the user', () => {
        let bar = new TabBar<Widget>();
        expect(bar.tabsMovable).to.equal(false);
      });

      it('should set whether the tabs are movable by the user', () => {
        let bar = new TabBar<Widget>();
        bar.tabsMovable = true;
        expect(bar.tabsMovable).to.equal(true);
      });

      it('should still allow programmatic moves', () => {
        populateBar(bar);
        let titles = bar.titles.slice();
        bar.insertTab(2, titles[0]);
        expect(bar.titles[2]).to.equal(titles[0]);
      });
    });

    describe('#addButtonEnabled', () => {
      it('should get whether the add button is enabled', () => {
        let bar = new TabBar<Widget>();
        expect(bar.addButtonEnabled).to.equal(false);
      });

      it('should set whether the add button is enabled', () => {
        let bar = new TabBar<Widget>();
        bar.addButtonEnabled = true;
        expect(bar.addButtonEnabled).to.equal(true);
      });

      it('should not show the add button if not set', () => {
        populateBar(bar);
        expect(bar.addButtonNode.classList.contains('lm-mod-hidden')).to.equal(
          true
        );

        bar.addButtonEnabled = true;
        expect(bar.addButtonNode.classList.contains('lm-mod-hidden')).to.equal(
          false
        );
      });
    });

    describe('#allowDeselect', () => {
      it('should determine whether a tab can be deselected by the user', () => {
        populateBar(bar);
        bar.allowDeselect = false;
        bar.tabsMovable = false;
        bar.currentIndex = 2;
        // Force the tabs to render
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        let tab = bar.contentNode.getElementsByClassName(
          'lm-TabBar-tab'
        )[2] as HTMLElement;
        simulateOnNode(tab, 'pointerdown');
        expect(bar.currentIndex).to.equal(2);
        simulateOnNode(tab, 'pointerup');

        bar.allowDeselect = true;
        simulateOnNode(tab, 'pointerdown');
        expect(bar.currentIndex).to.equal(-1);
        simulateOnNode(tab, 'pointerup');
      });

      it('should always allow programmatic deselection', () => {
        populateBar(bar);
        bar.allowDeselect = false;
        bar.currentIndex = -1;
        expect(bar.currentIndex).to.equal(-1);
      });
    });

    describe('#insertBehavior', () => {
      it('should not change the selection', () => {
        populateBar(bar);
        bar.insertBehavior = 'none';
        bar.currentIndex = 0;
        bar.insertTab(2, new Widget().title);
        expect(bar.currentIndex).to.equal(0);
      });

      it('should select the tab', () => {
        populateBar(bar);
        bar.insertBehavior = 'select-tab';
        bar.currentIndex = 0;
        bar.insertTab(2, new Widget().title);
        expect(bar.currentIndex).to.equal(2);

        bar.currentIndex = -1;
        bar.insertTab(1, new Widget().title);
        expect(bar.currentIndex).to.equal(1);
      });

      it('should select the tab if needed', () => {
        populateBar(bar);
        bar.insertBehavior = 'select-tab-if-needed';
        bar.currentIndex = 0;
        bar.insertTab(2, new Widget().title);
        expect(bar.currentIndex).to.equal(0);

        bar.currentIndex = -1;
        bar.insertTab(1, new Widget().title);
        expect(bar.currentIndex).to.equal(1);
      });
    });

    describe('#removeBehavior', () => {
      it('should select no tab', () => {
        populateBar(bar);
        bar.removeBehavior = 'none';
        bar.currentIndex = 2;
        bar.removeTabAt(2);
        expect(bar.currentIndex).to.equal(-1);
      });

      it('should select the tab after the removed tab if possible', () => {
        populateBar(bar);
        bar.removeBehavior = 'select-tab-after';
        bar.currentIndex = 0;
        bar.removeTabAt(0);
        expect(bar.currentIndex).to.equal(0);

        bar.currentIndex = 1;
        bar.removeTabAt(1);
        expect(bar.currentIndex).to.equal(0);
      });

      it('should select the tab before the removed tab if possible', () => {
        populateBar(bar);
        bar.removeBehavior = 'select-tab-before';
        bar.currentIndex = 1;
        bar.removeTabAt(1);
        expect(bar.currentIndex).to.equal(0);
        bar.removeTabAt(0);
        expect(bar.currentIndex).to.equal(0);
      });

      it('should select the previously selected tab if possible', () => {
        populateBar(bar);
        bar.removeBehavior = 'select-previous-tab';
        bar.currentIndex = 0;
        bar.currentIndex = 2;
        bar.removeTabAt(2);
        expect(bar.currentIndex).to.equal(0);

        // Reset the bar.
        bar.removeTabAt(0);
        bar.removeTabAt(0);
        populateBar(bar);

        bar.currentIndex = 1;
        bar.removeTabAt(1);
        expect(bar.currentIndex).to.equal(0);
      });
    });

    describe('#currentTitle', () => {
      it('should get the currently selected title', () => {
        populateBar(bar);
        bar.currentIndex = 0;
        expect(bar.currentTitle).to.equal(bar.titles[0]);
      });

      it('should be `null` if no tab is selected', () => {
        populateBar(bar);
        bar.currentIndex = -1;
        expect(bar.currentTitle).to.equal(null);
      });

      it('should set the currently selected title', () => {
        populateBar(bar);
        bar.currentTitle = bar.titles[1];
        expect(bar.currentTitle).to.equal(bar.titles[1]);
      });

      it('should set the title to `null` if the title does not exist', () => {
        populateBar(bar);
        bar.currentTitle = new Widget().title;
        expect(bar.currentTitle).to.equal(null);
      });
    });

    describe('#currentIndex', () => {
      it('should get index of the currently selected tab', () => {
        populateBar(bar);
        expect(bar.currentIndex).to.equal(0);
      });

      it('should be `null` if no tab is selected', () => {
        expect(bar.currentIndex).to.equal(-1);
      });

      it('should set index of the currently selected tab', () => {
        populateBar(bar);
        bar.currentIndex = 1;
        expect(bar.currentIndex).to.equal(1);
      });

      it('should set the index to `-1` if the value is out of range', () => {
        populateBar(bar);
        bar.currentIndex = -1;
        expect(bar.currentIndex).to.equal(-1);
        bar.currentIndex = 10;
        expect(bar.currentIndex).to.equal(-1);
      });

      it('should emit the `currentChanged` signal', () => {
        populateBar(bar);
        let titles = bar.titles;
        let called = false;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.previousIndex).to.equal(0);
          expect(args.previousTitle).to.equal(titles[0]);
          expect(args.currentIndex).to.equal(1);
          expect(args.currentTitle).to.equal(titles[1]);
          called = true;
        });
        bar.currentIndex = 1;
        expect(called).to.equal(true);
      });

      it('should schedule an update of the tabs', done => {
        populateBar(bar);
        requestAnimationFrame(() => {
          bar.currentIndex = 1;
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
            done();
          });
        });
      });

      it('should be a no-op if the index does not change', done => {
        populateBar(bar);
        requestAnimationFrame(() => {
          bar.currentIndex = 0;
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.equal(-1);
            done();
          });
        });
      });
    });

    describe('#orientation', () => {
      it('should be the orientation of the tab bar', () => {
        expect(bar.orientation).to.equal('horizontal');
        bar.orientation = 'vertical';
        expect(bar.orientation).to.equal('vertical');
      });

      it('should set the orientation attribute of the tab bar', () => {
        bar.orientation = 'horizontal';
        expect(bar.node.getAttribute('data-orientation')).to.equal(
          'horizontal'
        );
        bar.orientation = 'vertical';
        expect(bar.node.getAttribute('data-orientation')).to.equal('vertical');
      });
    });

    describe('#titles', () => {
      it('should get the read-only array of titles in the tab bar', () => {
        let bar = new TabBar<Widget>();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(widget => {
          bar.addTab(widget.title);
        });
        expect(bar.titles.length).to.equal(3);
        for (const [i, title] of bar.titles.entries()) {
          expect(title.owner).to.equal(widgets[i]);
        }
      });
    });

    describe('#contentNode', () => {
      it('should get the tab bar content node', () => {
        expect(
          bar.contentNode.classList.contains('lm-TabBar-content')
        ).to.equal(true);
      });
    });

    describe('#addTab()', () => {
      it('should add a tab to the end of the tab bar', () => {
        populateBar(bar);
        let title = new Widget().title;
        bar.addTab(title);
        expect(bar.titles[3]).to.equal(title);
      });

      it('should accept a title options object', () => {
        let owner = new Widget();
        bar.addTab({ owner, label: 'foo' });
        expect(bar.titles[0]).to.be.an.instanceof(Title);
        expect(bar.titles[0].label).to.equal('foo');
      });

      it('should move an existing title to the end', () => {
        populateBar(bar);
        let titles = bar.titles.slice();
        bar.addTab(titles[0]);
        expect(bar.titles[2]).to.equal(titles[0]);
      });
    });

    describe('#insertTab()', () => {
      it('should insert a tab into the tab bar at the specified index', () => {
        populateBar(bar);
        let title = new Widget().title;
        bar.insertTab(1, title);
        expect(bar.titles[1]).to.equal(title);
      });

      it('should accept a title options object', () => {
        populateBar(bar);
        let title = bar.insertTab(1, { owner: new Widget(), label: 'foo' });
        expect(title).to.be.an.instanceof(Title);
        expect(title.label).to.equal('foo');
      });

      it('should clamp the index to the bounds of the tabs', () => {
        populateBar(bar);
        let title = new Widget().title;
        bar.insertTab(-1, title);
        expect(bar.titles[0]).to.equal(title);
        title = new Widget().title;
        bar.insertTab(10, title);
        expect(bar.titles[4]).to.equal(title);
      });

      it('should move an existing tab', () => {
        populateBar(bar);
        let titles = bar.titles.slice();
        bar.insertTab(1, titles[0]);
        expect(bar.titles[1]).to.equal(titles[0]);
      });

      it('should schedule an update of the tabs', done => {
        let bar = new LogTabBar();
        bar.insertTab(0, new Widget().title);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
          done();
        });
      });

      it('should schedule an update if the title changes', done => {
        let bar = new LogTabBar();
        let title = new Widget().title;
        bar.insertTab(0, title);
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
          bar.methods = [];
          title.label = 'foo';
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
            done();
          });
        });
      });
    });

    describe('#removeTab()', () => {
      it('should remove a tab from the tab bar by value', () => {
        populateBar(bar);
        let titles = bar.titles.slice();
        bar.removeTab(titles[0]);
        expect(bar.titles[0]).to.equal(titles[1]);
      });

      it('should return be a no-op if the title is not in the tab bar', () => {
        populateBar(bar);
        bar.removeTab(new Widget().title);
      });

      it('should schedule an update of the tabs', done => {
        let bar = new LogTabBar();
        bar.insertTab(0, new Widget().title);
        requestAnimationFrame(() => {
          bar.removeTab(bar.titles[0]);
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
            done();
          });
        });
      });
    });

    describe('#removeTabAt()', () => {
      it('should remove a tab at a specific index', () => {
        populateBar(bar);
        let titles = bar.titles.slice();
        bar.removeTabAt(0);
        expect(bar.titles[0]).to.equal(titles[1]);
      });

      it('should return be a no-op if the index is out of range', () => {
        populateBar(bar);
        bar.removeTabAt(9);
      });

      it('should schedule an update of the tabs', done => {
        let bar = new LogTabBar();
        bar.insertTab(0, new Widget().title);
        requestAnimationFrame(() => {
          bar.removeTabAt(0);
          bar.methods = [];
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
            done();
          });
        });
      });
    });

    describe('#clearTabs()', () => {
      it('should remove all tabs from the tab bar', () => {
        populateBar(bar);
        bar.clearTabs();
        expect(bar.titles.length).to.equal(0);
      });

      it('should be a no-op if there are no tabs', () => {
        let bar = new TabBar<Widget>();
        bar.clearTabs();
        expect(bar.titles.length).to.equal(0);
      });

      it('should emit the `currentChanged` signal if there was a selected tab', () => {
        populateBar(bar);
        let called = false;
        bar.currentIndex = 0;
        bar.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(bar);
          expect(args.previousIndex).to.equal(0);
          called = true;
        });
        bar.clearTabs();
        expect(called).to.equal(true);
      });

      it('should not emit the `currentChanged` signal if there was no selected tab', () => {
        populateBar(bar);
        let called = false;
        bar.currentIndex = -1;
        bar.currentChanged.connect((sender, args) => {
          called = true;
        });
        bar.clearTabs();
        expect(called).to.equal(false);
      });
    });

    describe('#releaseMouse()', () => {
      it('should release the mouse and restore the non-dragged tab positions', () => {
        populateBar(bar);
        startDrag(bar, 0, 'left');
        bar.releaseMouse();
        document.body.dispatchEvent(new PointerEvent('pointermove'));
        expect(bar.events.indexOf('pointermove')).to.equal(-1);
      });
    });

    describe('#handleEvent()', () => {
      let tab: Element;
      let closeIcon: Element;

      beforeEach(() => {
        bar.tabsMovable = true;
        populateBar(bar);
        bar.currentIndex = 0;
        tab = bar.contentNode.children[0];
        closeIcon = tab.querySelector(bar.renderer.closeIconSelector)!;
      });

      context('left click', () => {
        it('should emit a tab close requested signal', () => {
          let called = false;
          let rect = closeIcon.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            expect(sender).to.equal(bar);
            expect(args.index).to.equal(0);
            expect(args.title).to.equal(bar.titles[0]);
            called = true;
          });
          closeIcon.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              bubbles: true
            })
          );
          closeIcon.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true
            })
          );
          expect(called).to.equal(true);
        });

        it('should do nothing if a drag is in progress', () => {
          startDrag(bar, 1, 'up');
          let called = false;
          let rect = closeIcon.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            called = true;
          });
          closeIcon.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true
            })
          );
          closeIcon.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true
            })
          );
          expect(called).to.equal(false);
        });

        it('should do nothing if the click is not on a close icon', () => {
          let called = false;
          let rect = closeIcon.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            called = true;
          });
          closeIcon.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true
            })
          );
          closeIcon.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: rect.left - 1,
              clientY: rect.top - 1,
              button: 0,
              cancelable: true
            })
          );
          expect(called).to.equal(false);
          expect(called).to.equal(false);
        });

        it('should do nothing if the tab is not closable', () => {
          let called = false;
          bar.titles[0].closable = false;
          let rect = closeIcon.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            called = true;
          });
          closeIcon.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true
            })
          );
          closeIcon.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true
            })
          );
          expect(called).to.equal(false);
        });
      });

      context('middle click', () => {
        it('should emit a tab close requested signal', () => {
          let called = false;
          let rect = tab.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            expect(sender).to.equal(bar);
            expect(args.index).to.equal(0);
            expect(args.title).to.equal(bar.titles[0]);
            called = true;
          });
          tab.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              bubbles: true
            })
          );
          tab.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true
            })
          );
          expect(called).to.equal(true);
        });

        it('should do nothing if a drag is in progress', () => {
          startDrag(bar, 1, 'up');
          let called = false;
          let rect = tab.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            called = true;
          });
          tab.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true
            })
          );
          tab.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true
            })
          );
          expect(called).to.equal(false);
        });

        it('should do nothing if the click is not on the tab', () => {
          let called = false;
          let rect = tab.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            called = true;
          });
          tab.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true
            })
          );
          tab.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: rect.left - 1,
              clientY: rect.top - 1,
              button: 1,
              cancelable: true
            })
          );
          expect(called).to.equal(false);
          expect(called).to.equal(false);
        });

        it('should do nothing if the tab is not closable', () => {
          let called = false;
          bar.titles[0].closable = false;
          let rect = tab.getBoundingClientRect();
          bar.tabCloseRequested.connect((sender, args) => {
            called = true;
          });
          tab.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true
            })
          );
          tab.dispatchEvent(
            new PointerEvent('pointerup', {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true
            })
          );
          expect(called).to.equal(false);
        });
      });

      context('pointerdown', () => {
        it('should add event listeners if the tabs are movable', () => {
          simulateOnNode(tab, 'pointerdown');
          document.body.dispatchEvent(new PointerEvent('pointermove'));
          expect(bar.events.indexOf('pointermove')).to.not.equal(-1);
        });

        it('should do nothing if not a left mouse press', () => {
          let rect = tab.getBoundingClientRect();
          tab.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true
            })
          );
          document.body.dispatchEvent(new PointerEvent('pointermove'));
          expect(bar.events.indexOf('pointermove')).to.equal(-1);
        });

        it('should do nothing if the press is not on a tab', () => {
          let rect = tab.getBoundingClientRect();
          tab.dispatchEvent(
            new PointerEvent('pointerdown', {
              clientX: rect.left - 1,
              clientY: rect.top,
              cancelable: true
            })
          );
          document.body.dispatchEvent(new PointerEvent('pointermove'));
          expect(bar.events.indexOf('pointermove')).to.equal(-1);
        });

        it('should do nothing if the press is on a close icon', () => {
          simulateOnNode(closeIcon, 'pointerdown');
          document.body.dispatchEvent(new PointerEvent('pointermove'));
          expect(bar.events.indexOf('pointermove')).to.equal(-1);
        });

        it('should do nothing if the tabs are not movable', () => {
          bar.tabsMovable = false;
          simulateOnNode(tab, 'pointerdown');
          document.body.dispatchEvent(new PointerEvent('pointermove'));
          expect(bar.events.indexOf('pointermove')).to.equal(-1);
        });

        it('should do nothing if there is a drag in progress', () => {
          startDrag(bar, 2, 'down');
          let rect = tab.getBoundingClientRect();
          let event = new PointerEvent('pointerdown', {
            clientX: rect.left,
            clientY: rect.top,
            cancelable: true
          });
          let cancelled = !tab.dispatchEvent(event);
          expect(cancelled).to.equal(false);
        });
      });

      context('pointermove', () => {
        it('should do nothing if there is a drag in progress', () => {
          simulateOnNode(tab, 'pointerdown');
          let called = 0;
          bar.tabDetachRequested.connect((sender, args) => {
            called++;
          });
          let rect = bar.contentNode.getBoundingClientRect();
          document.body.dispatchEvent(
            new PointerEvent('pointermove', {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true
            })
          );
          expect(called).to.equal(1);
          document.body.dispatchEvent(
            new PointerEvent('pointermove', {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true
            })
          );
          expect(called).to.equal(1);
        });

        it('should bail if the drag threshold is not exceeded', () => {
          simulateOnNode(tab, 'pointerdown');
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            bar.releaseMouse();
            called = true;
          });
          let rect = bar.contentNode.getBoundingClientRect();
          document.body.dispatchEvent(
            new PointerEvent('pointermove', {
              clientX: rect.right + 1,
              clientY: rect.top,
              cancelable: true
            })
          );
          expect(called).to.equal(false);
        });

        it('should emit the detach requested signal if the threshold is exceeded', () => {
          simulateOnNode(tab, 'pointerdown');
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            expect(sender).to.equal(bar);
            expect(args.index).to.equal(0);
            expect(args.title).to.equal(bar.titles[0]);
            expect(args.clientX).to.equal(rect.right + 200);
            expect(args.clientY).to.equal(rect.top);
            called = true;
          });
          let rect = bar.contentNode.getBoundingClientRect();
          document.body.dispatchEvent(
            new PointerEvent('pointermove', {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true
            })
          );
          expect(called).to.equal(true);
        });

        it('should bail if the signal handler aborted the drag', () => {
          simulateOnNode(tab, 'pointerdown');
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            bar.releaseMouse();
            called = true;
          });
          let rect = bar.contentNode.getBoundingClientRect();
          document.body.dispatchEvent(
            new PointerEvent('pointermove', {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true
            })
          );
          expect(called).to.equal(true);
          let left = rect.left;
          rect = tab.getBoundingClientRect();
          expect(left).to.equal(rect.left);
        });

        it('should update the positions of the tabs', () => {
          simulateOnNode(tab, 'pointerdown');
          let called = false;
          bar.tabDetachRequested.connect((sender, args) => {
            called = true;
          });
          let rect = bar.contentNode.getBoundingClientRect();
          document.body.dispatchEvent(
            new PointerEvent('pointermove', {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true
            })
          );
          expect(called).to.equal(true);
          let left = rect.left;
          rect = tab.getBoundingClientRect();
          expect(left).to.not.equal(rect.left);
        });
      });

      context('pointerup', () => {
        it('should emit the `tabMoved` signal', done => {
          startDrag(bar);
          document.body.dispatchEvent(new PointerEvent('pointerup'));
          bar.tabMoved.connect(() => {
            done();
          });
        });

        it('should move the tab to its final position', done => {
          startDrag(bar);
          document.body.dispatchEvent(new PointerEvent('pointerup'));
          let title = bar.titles[0];
          bar.tabMoved.connect(() => {
            expect(bar.titles[2]).to.equal(title);
            done();
          });
        });

        it('should cancel a middle mouse release', () => {
          startDrag(bar);
          let event = new PointerEvent('pointerup', {
            button: 1,
            cancelable: true
          });
          let cancelled = !document.body.dispatchEvent(event);
          expect(cancelled).to.equal(true);
        });
      });

      context('keydown', () => {
        it('should prevent default', () => {
          startDrag(bar);
          let event = new KeyboardEvent('keydown', { cancelable: true });
          let cancelled = !document.body.dispatchEvent(event);
          expect(cancelled).to.equal(true);
        });

        it('should release the mouse if `Escape` is pressed', () => {
          startDrag(bar);
          document.body.dispatchEvent(
            new KeyboardEvent('keydown', {
              keyCode: 27,
              cancelable: true
            })
          );
          simulateOnNode(tab, 'pointerdown');
          expect(bar.events.indexOf('pointermove')).to.equal(-1);
        });
      });

      context('contextmenu', () => {
        it('should prevent default', () => {
          startDrag(bar);
          let event = new MouseEvent('contextmenu', { cancelable: true });
          let cancelled = !document.body.dispatchEvent(event);
          expect(cancelled).to.equal(true);
        });
      });
    });

    describe('#onBeforeAttach()', () => {
      it('should add event listeners to the node', () => {
        let bar = new LogTabBar();
        Widget.attach(bar, document.body);
        expect(bar.methods).to.contain('onBeforeAttach');
        bar.node.dispatchEvent(
          new PointerEvent('pointerdown', {
            cancelable: true
          })
        );
        expect(bar.events.indexOf('pointerdown')).to.not.equal(-1);
        bar.dispose();
      });
    });

    describe('#onAfterDetach()', () => {
      it('should remove event listeners', () => {
        let bar = new LogTabBar();
        let owner = new Widget();
        bar.addTab(new Title({ owner, label: 'foo' }));
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        Widget.attach(bar, document.body);
        let tab = bar.contentNode.firstChild as HTMLElement;
        let rect = tab.getBoundingClientRect();
        tab.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: rect.left,
            clientY: rect.top,
            cancelable: true
          })
        );
        Widget.detach(bar);
        expect(bar.methods).to.contain('onAfterDetach');
        document.body.dispatchEvent(
          new PointerEvent('pointermove', {
            cancelable: true
          })
        );
        expect(bar.events.indexOf('pointermove')).to.equal(-1);
        document.body.dispatchEvent(
          new PointerEvent('pointerup', {
            cancelable: true
          })
        );
        expect(bar.events.indexOf('pointerup')).to.equal(-1);
      });
    });

    describe('#onUpdateRequest()', () => {
      it('should render tabs and set styles', () => {
        populateBar(bar);
        bar.currentIndex = 0;
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest);
        expect(bar.methods.indexOf('onUpdateRequest')).to.not.equal(-1);
        for (const [i, title] of bar.titles.entries()) {
          let tab = bar.contentNode.children[i] as HTMLElement;
          let label = tab.getElementsByClassName(
            'lm-TabBar-tabLabel'
          )[0] as HTMLElement;
          expect(label.textContent).to.equal(title.label);
          let current = i === 0;
          expect(tab.classList.contains('lm-mod-current')).to.equal(current);
        }
      });
    });

    describe('.Renderer', () => {
      let title: Title<Widget>;

      beforeEach(() => {
        let owner = new Widget();
        title = new Title({
          owner,
          label: 'foo',
          closable: true,
          iconClass: 'bar',
          className: 'fizz',
          caption: 'this is a caption'
        });
      });

      describe('#closeIconSelector', () => {
        it('should be `.lm-TabBar-tabCloseIcon`', () => {
          let renderer = new TabBar.Renderer();
          expect(renderer.closeIconSelector).to.equal(
            '.lm-TabBar-tabCloseIcon'
          );
        });
      });

      describe('#renderTab()', () => {
        it('should render a virtual node for a tab', () => {
          let renderer = new TabBar.Renderer();
          let vNode = renderer.renderTab({ title, current: true, zIndex: 1 });
          let node = VirtualDOM.realize(vNode);

          expect(
            node.getElementsByClassName('lm-TabBar-tabIcon').length
          ).to.equal(1);
          expect(
            node.getElementsByClassName('lm-TabBar-tabLabel').length
          ).to.equal(1);
          expect(
            node.getElementsByClassName('lm-TabBar-tabCloseIcon').length
          ).to.equal(1);

          expect(node.classList.contains('lm-TabBar-tab')).to.equal(true);
          expect(node.classList.contains(title.className)).to.equal(true);
          expect(node.classList.contains('lm-mod-current')).to.equal(true);
          expect(node.classList.contains('lm-mod-closable')).to.equal(true);
          expect(node.title).to.equal(title.caption);

          let label = node.getElementsByClassName(
            'lm-TabBar-tabLabel'
          )[0] as HTMLElement;
          expect(label.textContent).to.equal(title.label);

          let icon = node.getElementsByClassName(
            'lm-TabBar-tabIcon'
          )[0] as HTMLElement;
          expect(icon.classList.contains(title.iconClass)).to.equal(true);
        });
      });

      describe('#renderIcon()', () => {
        it('should render the icon element for a tab', () => {
          let renderer = new TabBar.Renderer();
          let vNode = renderer.renderIcon({ title, current: true, zIndex: 1 });
          let node = VirtualDOM.realize(vNode as VirtualElement);
          expect(node.className).to.contain('lm-TabBar-tabIcon');
          expect(node.classList.contains(title.iconClass)).to.equal(true);
        });
      });

      describe('#renderLabel()', () => {
        it('should render the label element for a tab', () => {
          let renderer = new TabBar.Renderer();
          let vNode = renderer.renderLabel({ title, current: true, zIndex: 1 });
          let label = VirtualDOM.realize(vNode);
          expect(label.className).to.contain('lm-TabBar-tabLabel');
          expect(label.textContent).to.equal(title.label);
        });
      });

      describe('#renderCloseIcon()', () => {
        it('should render the close icon element for a tab', () => {
          let renderer = new TabBar.Renderer();
          let vNode = renderer.renderCloseIcon({
            title,
            current: true,
            zIndex: 1
          });
          let icon = VirtualDOM.realize(vNode);
          expect(icon.className).to.contain('lm-TabBar-tabCloseIcon');
        });
      });

      describe('#createTabKey()', () => {
        it('should create a unique render key for the tab', () => {
          let renderer = new TabBar.Renderer();
          let key = renderer.createTabKey({ title, current: true, zIndex: 1 });
          let newKey = renderer.createTabKey({
            title,
            current: true,
            zIndex: 1
          });
          expect(key).to.equal(newKey);
        });
      });

      describe('#createTabStyle()', () => {
        it('should create the inline style object for a tab', () => {
          let renderer = new TabBar.Renderer();
          let style = renderer.createTabStyle({
            title,
            current: true,
            zIndex: 1
          });
          expect(style['zIndex']).to.equal('1');
        });
      });

      describe('#createTabClass()', () => {
        it('should create the class name for the tab', () => {
          let renderer = new TabBar.Renderer();
          let className = renderer.createTabClass({
            title,
            current: true,
            zIndex: 1
          });
          expect(className).to.contain('lm-TabBar-tab');
          expect(className).to.contain('lm-mod-closable');
          expect(className).to.contain('lm-mod-current');
        });
      });

      describe('#createIconClass()', () => {
        it('should create class name for the tab icon', () => {
          let renderer = new TabBar.Renderer();
          let className = renderer.createIconClass({
            title,
            current: true,
            zIndex: 1
          });
          expect(className).to.contain('lm-TabBar-tabIcon');
          expect(className).to.contain(title.iconClass);
        });
      });
    });

    describe('.defaultRenderer', () => {
      it('should be an instance of `Renderer`', () => {
        expect(TabBar.defaultRenderer).to.be.an.instanceof(TabBar.Renderer);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { StackedPanel, TabBar, TabPanel, Widget } from '@lumino/widgets';

import { LogWidget } from './widget.spec';

describe('@lumino/widgets', () => {
  describe('TabPanel', () => {
    describe('#constructor()', () => {
      it('should construct a new tab panel and take no arguments', () => {
        let panel = new TabPanel();
        expect(panel).to.be.an.instanceof(TabPanel);
      });

      it('should accept options', () => {
        let renderer = Object.create(TabBar.defaultRenderer);
        let panel = new TabPanel({
          tabPlacement: 'left',
          tabsMovable: true,
          renderer
        });
        expect(panel.tabBar.tabsMovable).to.equal(true);
        expect(panel.tabBar.renderer).to.equal(renderer);
      });

      it('should add a `lm-TabPanel` class', () => {
        let panel = new TabPanel();
        expect(panel.hasClass('lm-TabPanel')).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the widget', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.dispose();
        expect(panel.isDisposed).to.equal(true);
        panel.dispose();
        expect(panel.isDisposed).to.equal(true);
      });
    });

    describe('#currentChanged', () => {
      it('should be emitted when the current tab is changed', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        let called = false;
        let widgets = panel.widgets;
        panel.currentChanged.connect((sender, args) => {
          expect(sender).to.equal(panel);
          expect(args.previousIndex).to.equal(0);
          expect(args.previousWidget).to.equal(widgets[0]);
          expect(args.currentIndex).to.equal(1);
          expect(args.currentWidget).to.equal(widgets[1]);
          called = true;
        });
        panel.currentIndex = 1;
        expect(called).to.equal(true);
      });

      it('should not be emitted when another tab is inserted', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        let called = false;
        panel.currentChanged.connect((sender, args) => {
          called = true;
        });
        panel.insertWidget(0, new Widget());
        expect(called).to.equal(false);
      });

      it('should not be emitted when another tab is removed', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        let called = false;
        panel.currentIndex = 1;
        panel.currentChanged.connect((sender, args) => {
          called = true;
        });
        panel.widgets[0].parent = null;
        expect(called).to.equal(false);
      });

      it('should not be emitted when the current tab is moved', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        let called = false;
        panel.currentChanged.connect((sender, args) => {
          called = true;
        });
        panel.insertWidget(2, panel.widgets[0]);
        expect(called).to.equal(false);
      });
    });

    describe('#currentIndex', () => {
      it('should get the index of the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        expect(panel.currentIndex).to.equal(0);
      });

      it('should be `-1` if no tab is selected', () => {
        let panel = new TabPanel();
        expect(panel.currentIndex).to.equal(-1);
      });

      it('should set the index of the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentIndex = 1;
        expect(panel.currentIndex).to.equal(1);
      });

      it('should set the index to `-1` if out of range', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentIndex = -2;
        expect(panel.currentIndex).to.equal(-1);
        panel.currentIndex = 2;
        expect(panel.currentIndex).to.equal(-1);
      });
    });

    describe('#currentWidget', () => {
      it('should get the currently selected tab', () => {
        let panel = new TabPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.currentWidget).to.equal(widget);
      });

      it('should be `null` if no tab is selected', () => {
        let panel = new TabPanel();
        expect(panel.currentWidget).to.equal(null);
      });

      it('should set the currently selected tab', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        let widget = new Widget();
        panel.addWidget(widget);
        panel.currentWidget = widget;
        expect(panel.currentWidget).to.equal(widget);
      });

      it('should set `null` if the widget is not in the panel', () => {
        let panel = new TabPanel();
        panel.addWidget(new Widget());
        panel.addWidget(new Widget());
        panel.currentWidget = new Widget();
        expect(panel.currentWidget).to.equal(null);
      });
    });

    describe('#tabsMovable', () => {
      it('should be the tabsMovable property of the tabBar', () => {
        let panel = new TabPanel();
        expect(panel.tabsMovable).to.equal(false);
        panel.tabsMovable = true;
        expect(panel.tabBar.tabsMovable).to.equal(true);
      });
    });

    describe('#tabPlacement', () => {
      it('should be the tab placement for the tab panel', () => {
        let panel = new TabPanel();
        expect(panel.tabPlacement).to.equal('top');
        expect(panel.tabBar.orientation).to.equal('horizontal');
        expect(panel.tabBar.node.getAttribute('data-placement')).to.equal(
          'top'
        );

        panel.tabPlacement = 'bottom';
        expect(panel.tabBar.orientation).to.equal('horizontal');
        expect(panel.tabBar.node.getAttribute('data-placement')).to.equal(
          'bottom'
        );

        panel.tabPlacement = 'left';
        expect(panel.tabBar.orientation).to.equal('vertical');
        expect(panel.tabBar.node.getAttribute('data-placement')).to.equal(
          'left'
        );

        panel.tabPlacement = 'right';
        expect(panel.tabBar.orientation).to.equal('vertical');
        expect(panel.tabBar.node.getAttribute('data-placement')).to.equal(
          'right'
        );
      });
    });

    describe('#tabBar', () => {
      it('should get the tab bar associated with the tab panel', () => {
        let panel = new TabPanel();
        let bar = panel.tabBar;
        expect(bar).to.be.an.instanceof(TabBar);
      });

      it('should have the "lm-TabPanel-tabBar" class', () => {
        let panel = new TabPanel();
        let bar = panel.tabBar;
        expect(bar.hasClass('lm-TabPanel-tabBar')).to.equal(true);
      });

      it('should move the widget in the stacked panel when a tab is moved', () => {
        let panel = new TabPanel();
        let widgets = [new LogWidget(), new LogWidget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        Widget.attach(panel, document.body);
        let bar = panel.tabBar;
        let called = false;
        bar.tabMoved.connect(() => {
          let stack = panel.stackedPanel;
          expect(stack.widgets[1]).to.equal(widgets[0]);
          called = true;
        });
        (bar.tabMoved as any).emit({
          fromIndex: 0,
          toIndex: 1,
          title: widgets[0].title
        });
        expect(called).to.equal(true);
        panel.dispose();
      });

      it('should show the new widget when the current tab changes', () => {
        let panel = new TabPanel();
        let widgets = [new LogWidget(), new LogWidget(), new LogWidget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        widgets.forEach(w => {
          w.node.tabIndex = -1;
        });
        Widget.attach(panel, document.body);
        panel.tabBar.currentChanged.connect((sender, args) => {
          expect(widgets[args.previousIndex].isVisible).to.equal(false);
          expect(widgets[args.currentIndex].isVisible).to.equal(true);
        });
        panel.tabBar.currentIndex = 1;
        panel.dispose();
      });

      it('should close the widget when a tab is closed', () => {
        let panel = new TabPanel();
        let widget = new LogWidget();
        panel.addWidget(widget);
        Widget.attach(panel, document.body);
        let bar = panel.tabBar;
        let called = false;
        bar.tabCloseRequested.connect(() => {
          expect(widget.methods.indexOf('onCloseRequest')).to.not.equal(-1);
          called = true;
        });
        (bar.tabCloseRequested as any).emit({ index: 0, title: widget.title });
        expect(called).to.equal(true);
        panel.dispose();
      });
    });

    describe('#stackedPanel', () => {
      it('should get the stacked panel associated with the tab panel', () => {
        let panel = new TabPanel();
        let stack = panel.stackedPanel;
        expect(stack).to.be.an.instanceof(StackedPanel);
      });

      it('should have the "lm-TabPanel-stackedPanel" class', () => {
        let panel = new TabPanel();
        let stack = panel.stackedPanel;
        expect(stack.hasClass('lm-TabPanel-stackedPanel')).to.equal(true);
      });

      it('remove a tab when a widget is removed from the stacked panel', () => {
        let panel = new TabPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        let stack = panel.stackedPanel;
        let called = false;
        stack.widgetRemoved.connect(() => {
          let bar = panel.tabBar;
          expect(bar.titles).to.deep.equal([]);
          called = true;
        });
        widget.parent = null;
        expect(called).to.equal(true);
      });
    });

    describe('#widgets', () => {
      it('should get a read-only array of the widgets in the panel', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        expect(panel.widgets).to.deep.equal(widgets);
      });
    });

    describe('#addWidget()', () => {
      it('should add a widget to the end of the tab panel', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        let widget = new Widget();
        panel.addWidget(widget);
        expect(panel.widgets[3]).to.equal(widget);
        expect(panel.tabBar.titles[2]).to.equal(widgets[2].title);
      });

      it('should move an existing widget', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.addWidget(widgets[0]);
        expect(panel.widgets[2]).to.equal(widgets[0]);
      });
    });

    describe('#insertWidget()', () => {
      it('should insert a widget into the tab panel at a specified index', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        let widget = new Widget();
        panel.insertWidget(1, widget);
        expect(panel.widgets[1]).to.equal(widget);
        expect(panel.tabBar.titles[1]).to.equal(widget.title);
      });

      it('should move an existing widget', () => {
        let panel = new TabPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.insertWidget(0, widgets[2]);
        expect(panel.widgets[0]).to.equal(widgets[2]);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { Title } from '@lumino/widgets';

const owner = {
  name: 'Bob'
};

describe('@lumino/widgets', () => {
  describe('Title', () => {
    describe('#constructor()', () => {
      it('should accept title options', () => {
        let title = new Title({ owner });
        expect(title).to.be.an.instanceof(Title);
      });
    });

    describe('#changed', () => {
      it('should be emitted when the title state changes', () => {
        let called = false;
        let title = new Title({ owner });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.label = 'baz';
        expect(called).to.equal(true);
      });

      it('should be cleared if it is disposed', () => {
        let called = false;
        let title = new Title({ owner });
        title.changed.connect((sender, arg) => {
          called = true;
        });

        title.dispose();

        title.label = 'baz';
        expect(called).to.equal(false);
      });
    });

    describe('#owner', () => {
      it('should be the title owner', () => {
        let title = new Title({ owner });
        expect(title.owner).to.equal(owner);
      });
    });

    describe('#label', () => {
      it('should default to an empty string', () => {
        let title = new Title({ owner });
        expect(title.label).to.equal('');
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, label: 'foo' });
        expect(title.label).to.equal('foo');
      });

      it('should be writable', () => {
        let title = new Title({ owner, label: 'foo' });
        title.label = 'bar';
        expect(title.label).to.equal('bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, label: 'foo' });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.label = 'baz';
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, label: 'foo' });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.label = 'foo';
        expect(called).to.equal(false);
      });
    });

    describe('#mnemonic', () => {
      it('should default to `-1', () => {
        let title = new Title({ owner });
        expect(title.mnemonic).to.equal(-1);
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, mnemonic: 1 });
        expect(title.mnemonic).to.equal(1);
      });

      it('should be writable', () => {
        let title = new Title({ owner, mnemonic: 1 });
        title.mnemonic = 2;
        expect(title.mnemonic).to.equal(2);
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, mnemonic: 1 });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.mnemonic = 0;
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, mnemonic: 1 });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.mnemonic = 1;
        expect(called).to.equal(false);
      });
    });

    describe('#icon', () => {
      const iconRenderer = {
        render: (host: HTMLElement, options?: any) => {
          const renderNode = document.createElement('div');
          renderNode.className = 'foo';
          host.appendChild(renderNode);
        }
      };

      it('should default to undefined', () => {
        let title = new Title({ owner });
        expect(title.icon).to.equal(undefined);
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, icon: iconRenderer });
        expect(title.icon).to.equal(iconRenderer);
      });

      it('should be writable', () => {
        let title = new Title({ owner });
        expect(title.icon).to.equal(undefined);
        title.icon = iconRenderer;
        expect(title.icon).to.equal(iconRenderer);
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.icon = iconRenderer;
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, icon: iconRenderer });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.icon = iconRenderer;
        expect(called).to.equal(false);
      });
    });

    describe('#caption', () => {
      it('should default to an empty string', () => {
        let title = new Title({ owner });
        expect(title.caption).to.equal('');
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, caption: 'foo' });
        expect(title.caption).to.equal('foo');
      });

      it('should be writable', () => {
        let title = new Title({ owner, caption: 'foo' });
        title.caption = 'bar';
        expect(title.caption).to.equal('bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, caption: 'foo' });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.caption = 'baz';
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, caption: 'foo' });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.caption = 'foo';
        expect(called).to.equal(false);
      });
    });

    describe('#className', () => {
      it('should default to an empty string', () => {
        let title = new Title({ owner });
        expect(title.className).to.equal('');
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, className: 'foo' });
        expect(title.className).to.equal('foo');
      });

      it('should be writable', () => {
        let title = new Title({ owner, className: 'foo' });
        title.className = 'bar';
        expect(title.className).to.equal('bar');
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, className: 'foo' });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.className = 'baz';
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, className: 'foo' });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.className = 'foo';
        expect(called).to.equal(false);
      });
    });

    describe('#closable', () => {
      it('should default to `false`', () => {
        let title = new Title({ owner });
        expect(title.closable).to.equal(false);
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, closable: true });
        expect(title.closable).to.equal(true);
      });

      it('should be writable', () => {
        let title = new Title({ owner, closable: true });
        title.closable = false;
        expect(title.closable).to.equal(false);
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, closable: false });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.closable = true;
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let title = new Title({ owner, closable: false });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.closable = false;
        expect(called).to.equal(false);
      });
    });

    describe('#dataset', () => {
      it('should default to `{}`', () => {
        let title = new Title({ owner });
        expect(title.dataset).to.deep.equal({});
      });

      it('should initialize from the options', () => {
        let title = new Title({ owner, dataset: { foo: '12' } });
        expect(title.dataset).to.deep.equal({ foo: '12' });
      });

      it('should be writable', () => {
        let title = new Title({ owner, dataset: { foo: '12' } });
        title.dataset = { bar: '42' };
        expect(title.dataset).to.deep.equal({ bar: '42' });
      });

      it('should emit the changed signal when the value changes', () => {
        let called = false;
        let title = new Title({ owner, dataset: { foo: '12' } });
        title.changed.connect((sender, arg) => {
          expect(sender).to.equal(title);
          expect(arg).to.equal(undefined);
          called = true;
        });
        title.dataset = { bar: '42' };
        expect(called).to.equal(true);
      });

      it('should not emit the changed signal when the value does not change', () => {
        let called = false;
        let dataset = { foo: '12' };
        let title = new Title({ owner, dataset });
        title.changed.connect((sender, arg) => {
          called = true;
        });
        title.dataset = dataset;
        expect(called).to.equal(false);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { ArrayExt } from '@lumino/algorithm';

import { Message, MessageLoop } from '@lumino/messaging';

import { Layout, Title, Widget } from '@lumino/widgets';

export class LogWidget extends Widget {
  messages: string[] = [];

  methods: string[] = [];

  raw: Message[] = [];

  processMessage(msg: Message): void {
    super.processMessage(msg);
    this.messages.push(msg.type);
  }

  protected notifyLayout(msg: Message): void {
    super.notifyLayout(msg);
    this.methods.push('notifyLayout');
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.methods.push('onActivateRequest');
  }

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.methods.push('onCloseRequest');
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.methods.push('onResize');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.methods.push('onAfterShow');
  }

  protected onBeforeHide(msg: Message): void {
    super.onBeforeHide(msg);
    this.methods.push('onBeforeHide');
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  protected onChildAdded(msg: Widget.ChildMessage): void {
    super.onChildAdded(msg);
    this.methods.push('onChildAdded');
    this.raw.push(msg);
  }

  protected onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
    this.raw.push(msg);
  }
}

class TestLayout extends Layout {
  dispose(): void {
    while (this._widgets.length !== 0) {
      this._widgets.pop()!.dispose();
    }
    super.dispose();
  }

  *[Symbol.iterator](): IterableIterator<Widget> {
    yield* this._widgets;
  }

  removeWidget(widget: Widget): void {
    ArrayExt.removeFirstOf(this._widgets, widget);
  }

  private _widgets = [new Widget(), new Widget()];
}

describe('@lumino/widgets', () => {
  describe('Widget', () => {
    describe('#constructor()', () => {
      it('should accept no arguments', () => {
        let widget = new Widget();
        expect(widget).to.be.an.instanceof(Widget);
      });

      it('should accept options', () => {
        let span = document.createElement('span');
        let widget = new Widget({ node: span });
        expect(widget.node).to.equal(span);
      });

      it('should add the `lm-Widget` class', () => {
        let widget = new Widget();
        expect(widget.hasClass('lm-Widget')).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the widget', () => {
        let widget = new Widget();
        widget.dispose();
        expect(widget.isDisposed).to.equal(true);
      });

      it('should be a no-op if the widget already disposed', () => {
        let called = false;
        let widget = new Widget();
        widget.dispose();
        widget.disposed.connect(() => {
          called = true;
        });
        widget.dispose();
        expect(called).to.equal(false);
        expect(widget.isDisposed).to.equal(true);
      });

      it('should remove the widget from its parent', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        child.dispose();
        expect(parent.isDisposed).to.equal(false);
        expect(child.isDisposed).to.equal(true);
        expect(child.parent).to.equal(null);
      });

      it('should automatically detach the widget', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        widget.dispose();
        expect(widget.isAttached).to.equal(false);
      });

      it('should dispose of the widget layout', () => {
        let widget = new Widget();
        let layout = new TestLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.isDisposed).to.equal(true);
      });

      it('should dispose of the widget title', () => {
        const widget = new Widget();
        const title = widget.title;
        widget.dispose();
        expect(title.isDisposed).to.equal(true);
      });
    });

    describe('#disposed', () => {
      it('should be emitted when the widget is disposed', () => {
        let called = false;
        let widget = new Widget();
        widget.disposed.connect(() => {
          called = true;
        });
        widget.dispose();
        expect(called).to.equal(true);
      });
    });

    describe('#isDisposed', () => {
      it('should be `true` if the widget is disposed', () => {
        let widget = new Widget();
        widget.dispose();
        expect(widget.isDisposed).to.equal(true);
      });

      it('should be `false` if the widget is not disposed', () => {
        let widget = new Widget();
        expect(widget.isDisposed).to.equal(false);
      });
    });

    describe('#isAttached', () => {
      it('should be `true` if the widget is attached', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not attached', () => {
        let widget = new Widget();
        expect(widget.isAttached).to.equal(false);
      });
    });

    describe('#isHidden', () => {
      it('should be `true` if the widget is hidden', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.isHidden).to.equal(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not hidden', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isHidden).to.equal(false);
        widget.dispose();
      });
    });

    describe('#isVisible', () => {
      it('should be `true` if the widget is visible', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isVisible).to.equal(true);
        widget.dispose();
      });

      it('should be `false` if the widget is not visible', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.isVisible).to.equal(false);
        widget.dispose();
      });

      it('should be `false` if the widget is not attached', () => {
        let widget = new Widget();
        expect(widget.isVisible).to.equal(false);
      });
    });

    describe('#node', () => {
      it('should get the DOM node owned by the widget', () => {
        let widget = new Widget();
        let node = widget.node;
        expect(node.tagName.toLowerCase()).to.equal('div');
      });
    });

    describe('#id', () => {
      it('should get the id of the widget node', () => {
        let widget = new Widget();
        widget.node.id = 'foo';
        expect(widget.id).to.equal('foo');
      });

      it('should set the id of the widget node', () => {
        let widget = new Widget();
        widget.id = 'bar';
        expect(widget.node.id).to.equal('bar');
      });
    });

    describe('#dataset', () => {
      it('should get the dataset of the widget node', () => {
        let widget = new Widget();
        expect(widget.dataset).to.equal(widget.node.dataset);
      });
    });

    describe('#title', () => {
      it('should get the title data object for the widget', () => {
        let widget = new Widget();
        expect(widget.title).to.be.an.instanceof(Title);
      });
    });

    describe('#parent', () => {
      it('should default to `null`', () => {
        let widget = new Widget();
        expect(widget.parent).to.equal(null);
      });

      it('should set the parent and send a `child-added` messagee', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(child.parent).to.equal(parent);
        expect(parent.messages).to.contain('child-added');
      });

      it('should remove itself from the current parent', () => {
        let parent0 = new LogWidget();
        let parent1 = new LogWidget();
        let child = new Widget();
        child.parent = parent0;
        child.parent = parent1;
        expect(parent0.messages).to.contain('child-removed');
        expect(parent1.messages).to.contain('child-added');
      });

      it('should throw an error if the widget contains the parent', () => {
        let widget0 = new Widget();
        let widget1 = new Widget();
        widget0.parent = widget1;
        expect(() => {
          widget1.parent = widget0;
        }).to.throw(Error);
      });

      it('should be a no-op if there is no parent change', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.parent = parent;
        expect(parent.messages).to.not.contain('child-removed');
      });
    });

    describe('#layout', () => {
      it('should default to `null`', () => {
        let widget = new Widget();
        expect(widget.layout).to.equal(null);
      });

      it('should set the layout for the widget', () => {
        let widget = new Widget();
        let layout = new TestLayout();
        widget.layout = layout;
        expect(widget.layout).to.equal(layout);
      });

      it('should be single-use only', () => {
        let widget = new Widget();
        widget.layout = new TestLayout();
        expect(() => {
          widget.layout = new TestLayout();
        }).to.throw(Error);
      });

      it('should be disposed when the widget is disposed', () => {
        let widget = new Widget();
        let layout = new TestLayout();
        widget.layout = layout;
        widget.dispose();
        expect(layout.isDisposed).to.equal(true);
      });

      it('should be a no-op if the layout is the same', () => {
        let widget = new Widget();
        let layout = new TestLayout();
        widget.layout = layout;
        widget.layout = layout;
        expect(widget.layout).to.equal(layout);
      });

      it('should throw an error if the layout already has a parent', () => {
        let widget0 = new Widget();
        let widget1 = new Widget();
        let layout = new TestLayout();
        widget0.layout = layout;
        expect(() => {
          widget1.layout = layout;
        }).to.throw(Error);
      });

      it('should throw an error if the `DisallowLayout` flag is set', () => {
        let widget = new Widget();
        widget.setFlag(Widget.Flag.DisallowLayout);
        let layout = new TestLayout();
        expect(() => {
          widget.layout = layout;
        }).to.throw(Error);
      });
    });

    describe('#children()', () => {
      it('should return an iterator over the widget children', () => {
        let widget = new Widget();
        widget.layout = new TestLayout();
        for (const child of widget.children()) {
          expect(child).to.be.an.instanceof(Widget);
        }
      });

      it('should return an empty iterator if there is no layout', () => {
        let widget = new Widget();
        expect(widget.children().next().done).to.equal(true);
      });
    });

    describe('#contains()', () => {
      it('should return `true` if the widget is a descendant', () => {
        let p1 = new Widget();
        let p2 = new Widget();
        let p3 = new Widget();
        let w1 = new Widget();
        let w2 = new Widget();
        p2.parent = p1;
        p3.parent = p2;
        w1.parent = p2;
        w2.parent = p3;
        expect(p1.contains(p1)).to.equal(true);
        expect(p1.contains(p2)).to.equal(true);
        expect(p1.contains(p3)).to.equal(true);
        expect(p1.contains(w1)).to.equal(true);
        expect(p1.contains(w2)).to.equal(true);
        expect(p2.contains(p2)).to.equal(true);
        expect(p2.contains(p3)).to.equal(true);
        expect(p2.contains(w1)).to.equal(true);
        expect(p2.contains(w2)).to.equal(true);
        expect(p3.contains(p3)).to.equal(true);
        expect(p3.contains(w2)).to.equal(true);
      });

      it('should return `false` if the widget is not a descendant', () => {
        let p1 = new Widget();
        let p2 = new Widget();
        let p3 = new Widget();
        let w1 = new Widget();
        let w2 = new Widget();
        p2.parent = p1;
        p3.parent = p2;
        w1.parent = p2;
        w2.parent = p3;
        expect(p2.contains(p1)).to.equal(false);
        expect(p3.contains(p1)).to.equal(false);
        expect(p3.contains(p2)).to.equal(false);
        expect(p3.contains(w1)).to.equal(false);
        expect(w1.contains(p1)).to.equal(false);
        expect(w1.contains(p2)).to.equal(false);
        expect(w1.contains(p3)).to.equal(false);
        expect(w1.contains(w2)).to.equal(false);
        expect(w2.contains(p1)).to.equal(false);
        expect(w2.contains(p2)).to.equal(false);
        expect(w2.contains(p3)).to.equal(false);
        expect(w2.contains(w1)).to.equal(false);
      });
    });

    describe('#hasClass()', () => {
      it('should return `true` if a node has a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.node.classList.add('baz');
        expect(widget.hasClass('foo')).to.equal(true);
        expect(widget.hasClass('bar')).to.equal(true);
        expect(widget.hasClass('baz')).to.equal(true);
      });

      it('should return `false` if a node does not have a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.node.classList.add('baz');
        expect(widget.hasClass('one')).to.equal(false);
        expect(widget.hasClass('two')).to.equal(false);
        expect(widget.hasClass('three')).to.equal(false);
      });
    });

    describe('#addClass()', () => {
      it('should add a class to the DOM node', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.equal(false);
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
        expect(widget.node.classList.contains('bar')).to.equal(false);
        widget.addClass('bar');
        expect(widget.node.classList.contains('bar')).to.equal(true);
      });

      it('should be a no-op if the class is already present', () => {
        let widget = new Widget();
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
        widget.addClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
      });
    });

    describe('#removeClass()', () => {
      it('should remove the class from the DOM node', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        widget.node.classList.add('bar');
        widget.removeClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(false);
        expect(widget.node.classList.contains('bar')).to.equal(true);
        widget.removeClass('bar');
        expect(widget.node.classList.contains('bar')).to.equal(false);
      });

      it('should be a no-op if the class is not present', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.equal(false);
        widget.removeClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(false);
      });
    });

    describe('#toggleClass()', () => {
      it('should toggle the presence of a class', () => {
        let widget = new Widget();
        widget.toggleClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
        widget.toggleClass('foo');
        expect(widget.node.classList.contains('foo')).to.equal(false);
      });

      it('should force-add a class', () => {
        let widget = new Widget();
        expect(widget.node.classList.contains('foo')).to.equal(false);
        widget.toggleClass('foo', true);
        expect(widget.node.classList.contains('foo')).to.equal(true);
        widget.toggleClass('foo', true);
        expect(widget.node.classList.contains('foo')).to.equal(true);
      });

      it('should force-remove a class', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        expect(widget.node.classList.contains('foo')).to.equal(true);
        widget.toggleClass('foo', false);
        expect(widget.node.classList.contains('foo')).to.equal(false);
        widget.toggleClass('foo', false);
        expect(widget.node.classList.contains('foo')).to.equal(false);
      });

      it('should return `true` if the class is present', () => {
        let widget = new Widget();
        expect(widget.toggleClass('foo')).to.equal(true);
        expect(widget.toggleClass('foo', true)).to.equal(true);
      });

      it('should return `false` if the class is not present', () => {
        let widget = new Widget();
        widget.node.classList.add('foo');
        expect(widget.toggleClass('foo')).to.equal(false);
        expect(widget.toggleClass('foo', false)).to.equal(false);
      });
    });

    describe('#update()', () => {
      it('should post an `update-request` message', done => {
        let widget = new LogWidget();
        widget.update();
        expect(widget.messages).to.deep.equal([]);
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(['update-request']);
          done();
        });
      });
    });

    describe('#fit()', () => {
      it('should post a `fit-request` message to the widget', done => {
        let widget = new LogWidget();
        widget.fit();
        expect(widget.messages).to.deep.equal([]);
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(['fit-request']);
          done();
        });
      });
    });

    describe('#activate()', () => {
      it('should post an `activate-request` message', done => {
        let widget = new LogWidget();
        widget.activate();
        expect(widget.messages).to.deep.equal([]);
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(['activate-request']);
          done();
        });
      });
    });

    describe('#close()', () => {
      it('should send a `close-request` message', () => {
        let widget = new LogWidget();
        expect(widget.messages).to.deep.equal([]);
        widget.close();
        expect(widget.messages).to.deep.equal(['close-request']);
      });
    });

    describe('#show()', () => {
      it('should set `isHidden` to `false`', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.isHidden).to.equal(true);
        widget.show();
        expect(widget.isHidden).to.equal(false);
      });

      it('should remove the "lm-mod-hidden" class', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.hasClass('lm-mod-hidden')).to.equal(true);
        widget.show();
        expect(widget.hasClass('lm-mod-hidden')).to.equal(false);
      });

      it('should send an `after-show` message if applicable', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.show();
        expect(widget.messages).to.contains('after-show');
        widget.dispose();
      });

      it('should send a `child-shown` message to the parent', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.hide();
        child.show();
        expect(parent.messages).to.contains('child-shown');
      });

      it('should be a no-op if not hidden', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.show();
        expect(widget.messages).to.not.contains('after-show');
        widget.dispose();
      });
    });

    describe('#hide()', () => {
      it('should hide the widget', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.isHidden).to.equal(true);
      });

      it('should add the `lm-mod-hidden` class', () => {
        let widget = new Widget();
        widget.hide();
        expect(widget.hasClass('lm-mod-hidden')).to.equal(true);
      });

      it('should send a `before-hide` message if applicable', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.messages).to.contain('before-hide');
        widget.dispose();
      });

      it('should send a `child-hidden` message to the parent', () => {
        let parent = new LogWidget();
        let child = new Widget();
        child.parent = parent;
        child.hide();
        expect(parent.messages).to.contain('child-hidden');
      });

      it('should be a no-op if already hidden', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.messages).to.not.contain('before-hide');
        widget.dispose();
      });
    });

    describe('#setHidden()', () => {
      it('should call hide if `hidden = true`', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.setHidden(true);
        expect(widget.isHidden).to.equal(true);
        expect(widget.messages).to.contain('before-hide');
        widget.dispose();
      });

      it('should call show if `hidden = false`', () => {
        let widget = new LogWidget();
        widget.hide();
        Widget.attach(widget, document.body);
        widget.setHidden(false);
        expect(widget.isHidden).to.equal(false);
        expect(widget.messages).to.contain('after-show');
        widget.dispose();
      });
    });

    describe('#hiddenMode', () => {
      it('should use class to hide the widget by default', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.hasClass('lm-mod-hidden')).to.equal(true);
        expect(widget.node.style.transform).to.be.equal('');
        expect(widget.node.style.willChange).to.not.equal('transform');
        widget.dispose();
      });

      it('should use transformation if in "scale" mode', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hiddenMode = Widget.HiddenMode.Scale;
        widget.hide();
        expect(widget.hasClass('lm-mod-hidden')).to.equal(false);
        expect(widget.node.style.transform).to.equal('scale(0)');
        expect(widget.node.style.willChange).to.equal('transform');
        widget.dispose();
      });

      it('should remove class when switching from display to scale', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hide();
        widget.hiddenMode = Widget.HiddenMode.Scale;
        expect(widget.hasClass('lm-mod-hidden')).to.equal(false);
        expect(widget.node.style.transform).to.equal('scale(0)');
        expect(widget.node.style.willChange).to.equal('transform');
        widget.dispose();
      });

      it('should add class when switching from scale to display', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        widget.hiddenMode = Widget.HiddenMode.Scale;
        widget.hide();
        widget.hiddenMode = Widget.HiddenMode.Display;
        expect(widget.hasClass('lm-mod-hidden')).to.equal(true);
        expect(widget.node.style.transform).to.equal('');
        expect(widget.node.style.willChange).to.equal('auto');
        widget.dispose();
      });
    });

    describe('#testFlag()', () => {
      it('should test whether the given widget flag is set', () => {
        let widget = new Widget();
        expect(widget.testFlag(Widget.Flag.IsHidden)).to.equal(false);
      });
    });

    describe('#setFlag()', () => {
      it('should set the given widget flag', () => {
        let widget = new Widget();
        widget.setFlag(Widget.Flag.IsHidden);
        expect(widget.testFlag(Widget.Flag.IsHidden)).to.equal(true);
      });
    });

    describe('#clearFlag()', () => {
      it('should clear the given widget flag', () => {
        let widget = new Widget();
        widget.setFlag(Widget.Flag.IsHidden);
        widget.clearFlag(Widget.Flag.IsHidden);
        expect(widget.testFlag(Widget.Flag.IsHidden)).to.equal(false);
      });
    });

    describe('#notifyLayout()', () => {
      it("should send a message to the widget's layout", () => {
        let child = new LogWidget();
        let parent = new LogWidget();
        let layout = new TestLayout();
        parent.layout = layout;
        child.parent = parent;
        expect(parent.methods).to.contain('notifyLayout');
      });
    });

    describe('#onActivateRequest()', () => {
      it('should be invoked on an `activate-request', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.ActivateRequest);
        expect(widget.methods).to.contain('onActivateRequest');
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.ActivateRequest);
        expect(widget.methods).to.contain('notifyLayout');
      });
    });

    describe('#onCloseRequest()', () => {
      it('should be invoked on a `close-request`', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest);
        expect(widget.messages).to.contain('close-request');
        expect(widget.methods).to.contain('onCloseRequest');
      });

      it('should unparent a child widget by default', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        MessageLoop.sendMessage(child, Widget.Msg.CloseRequest);
        expect(child.parent).to.equal(null);
      });

      it('should detach a root widget by default', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest);
        expect(widget.isAttached).to.equal(false);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest);
        expect(widget.methods).to.contain('notifyLayout');
      });
    });

    describe('#onResize()', () => {
      it('should be invoked when the widget is resized', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
        expect(widget.messages).to.contain('resize');
        expect(widget.methods).to.contain('onResize');
        widget.dispose();
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
        expect(widget.methods).to.contain('notifyLayout');
        widget.dispose();
      });
    });

    describe('#onUpdateRequest()', () => {
      it('should be invoked when an update is requested', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest);
        expect(widget.messages).to.contain('update-request');
        expect(widget.methods).to.contain('onUpdateRequest');
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest);
        expect(widget.methods).to.contain('notifyLayout');
      });
    });

    describe('#onAfterShow()', () => {
      it('should be invoked just after the widget is made visible', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        widget.show();
        expect(widget.messages).to.contain('after-show');
        expect(widget.methods).to.contain('onAfterShow');
        widget.dispose();
      });

      it('should set the `isVisible` flag', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(false);
        widget.show();
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        widget.dispose();
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        widget.show();
        expect(widget.methods).to.contain('notifyLayout');
        widget.dispose();
      });
    });

    describe('#onBeforeHide()', () => {
      it('should be invoked just before the widget is made not-visible', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.messages).to.contain('before-hide');
        expect(widget.methods).to.contain('onBeforeHide');
        widget.dispose();
      });

      it('should clear the `isVisible` flag', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        widget.hide();
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(false);
        widget.dispose();
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.hide();
        expect(widget.methods).to.contain('notifyLayout');
        widget.dispose();
      });
    });

    describe('#onAfterAttach()', () => {
      it('should be invoked just after the widget is attached', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.messages).to.contain('after-attach');
        expect(widget.methods).to.contain('onAfterAttach');
        widget.dispose();
      });

      it('should set the visible flag if warranted', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        Widget.detach(widget);

        widget.hide();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(false);
        Widget.detach(widget);

        let child = new LogWidget();
        child.parent = widget;
        widget.show();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        Widget.detach(widget);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.methods).to.contain('notifyLayout');
        widget.dispose();
      });
    });

    describe('#onBeforeDetach()', () => {
      it('should be invoked just before the widget is detached', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        Widget.detach(widget);
        expect(widget.messages).to.contain('before-detach');
        expect(widget.methods).to.contain('onBeforeDetach');
      });

      it('should clear the `isVisible` and `isAttached` flags', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(true);
        expect(widget.testFlag(Widget.Flag.IsAttached)).to.equal(true);
        Widget.detach(widget);
        expect(widget.testFlag(Widget.Flag.IsVisible)).to.equal(false);
        expect(widget.testFlag(Widget.Flag.IsAttached)).to.equal(false);
      });

      it('should notify the layout', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        Widget.detach(widget);
        expect(widget.methods).to.contain('notifyLayout');
      });
    });

    describe('#onChildAdded()', () => {
      it('should be invoked when a child is added', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(parent.methods).to.contain('onChildAdded');
      });

      it('should notify the layout', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        expect(parent.methods).to.contain('notifyLayout');
      });

      context('`msg` parameter', () => {
        it('should be a `ChildMessage`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect(parent.raw[0]).to.be.an.instanceof(Widget.ChildMessage);
        });

        it('should have a `type` of `child-added`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect(parent.raw[0].type).to.equal('child-added');
        });

        it('should have the correct `child`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          expect((parent.raw[0] as Widget.ChildMessage).child).to.equal(child);
        });
      });
    });

    describe('#onChildRemoved()', () => {
      it('should be invoked when a child is removed', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        child.parent = null;
        expect(parent.methods).to.contain('onChildRemoved');
      });

      it('should notify the layout', () => {
        let child = new Widget();
        let parent = new LogWidget();
        child.parent = parent;
        parent.methods = [];
        child.parent = null;
        expect(parent.methods).to.contain('notifyLayout');
      });

      context('`msg` parameter', () => {
        it('should be a `ChildMessage`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect(parent.raw[0]).to.be.an.instanceof(Widget.ChildMessage);
        });

        it('should have a `type` of `child-removed`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect((parent.raw[0] as Widget.ChildMessage).type).to.equal(
            'child-removed'
          );
        });

        it('should have the correct `child`', () => {
          let child = new Widget();
          let parent = new LogWidget();
          child.parent = parent;
          parent.raw = [];
          child.parent = null;
          expect((parent.raw[0] as Widget.ChildMessage).child).to.equal(child);
        });
      });
    });

    describe('.ChildMessage', () => {
      describe('#constructor()', () => {
        it('should accept the message type and child widget', () => {
          let msg = new Widget.ChildMessage('test', new Widget());
          expect(msg).to.be.an.instanceof(Widget.ChildMessage);
        });
      });

      describe('#child', () => {
        it('should be the child passed to the constructor', () => {
          let widget = new Widget();
          let msg = new Widget.ChildMessage('test', widget);
          expect(msg.child).to.equal(widget);
        });
      });
    });

    describe('.ResizeMessage', () => {
      describe('#constructor()', () => {
        it('should accept a width and height', () => {
          let msg = new Widget.ResizeMessage(100, 100);
          expect(msg).to.be.an.instanceof(Widget.ResizeMessage);
        });
      });

      describe('#width', () => {
        it('should be the width passed to the constructor', () => {
          let msg = new Widget.ResizeMessage(100, 200);
          expect(msg.width).to.equal(100);
        });
      });

      describe('#height', () => {
        it('should be the height passed to the constructor', () => {
          let msg = new Widget.ResizeMessage(100, 200);
          expect(msg.height).to.equal(200);
        });
      });

      describe('.UnknownSize', () => {
        it('should be a `ResizeMessage`', () => {
          let msg = Widget.ResizeMessage.UnknownSize;
          expect(msg).to.be.an.instanceof(Widget.ResizeMessage);
        });

        it('should have a `width` of `-1`', () => {
          let msg = Widget.ResizeMessage.UnknownSize;
          expect(msg.width).to.equal(-1);
        });

        it('should have a `height` of `-1`', () => {
          let msg = Widget.ResizeMessage.UnknownSize;
          expect(msg.height).to.equal(-1);
        });
      });
    });

    describe('.attach()', () => {
      it('should attach a root widget to a host', () => {
        let widget = new Widget();
        expect(widget.isAttached).to.equal(false);
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        widget.dispose();
      });

      it('should throw if the widget is not a root', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        expect(() => {
          Widget.attach(child, document.body);
        }).to.throw(Error);
      });

      it('should throw if the widget is already attached', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(() => {
          Widget.attach(widget, document.body);
        }).to.throw(Error);
        widget.dispose();
      });

      it('should throw if the host is not attached to the DOM', () => {
        let widget = new Widget();
        let host = document.createElement('div');
        expect(() => {
          Widget.attach(widget, host);
        }).to.throw(Error);
      });

      it('should dispatch an `after-attach` message', () => {
        let widget = new LogWidget();
        expect(widget.isAttached).to.equal(false);
        expect(widget.messages).to.not.contain('after-attach');
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        expect(widget.messages).to.contain('after-attach');
        widget.dispose();
      });
    });

    describe('.detach()', () => {
      it('should detach a root widget from its host', () => {
        let widget = new Widget();
        Widget.attach(widget, document.body);
        expect(widget.isAttached).to.equal(true);
        Widget.detach(widget);
        expect(widget.isAttached).to.equal(false);
        widget.dispose();
      });

      it('should throw if the widget is not a root', () => {
        let parent = new Widget();
        let child = new Widget();
        child.parent = parent;
        Widget.attach(parent, document.body);
        expect(() => {
          Widget.detach(child);
        }).to.throw(Error);
        parent.dispose();
      });

      it('should throw if the widget is not attached', () => {
        let widget = new Widget();
        expect(() => {
          Widget.detach(widget);
        }).to.throw(Error);
      });

      it('should dispatch a `before-detach` message', () => {
        let widget = new LogWidget();
        Widget.attach(widget, document.body);
        widget.messages = [];
        Widget.detach(widget);
        expect(widget.messages).to.contain('before-detach');
        widget.dispose();
      });
    });
  });
});
