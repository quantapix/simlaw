import * as d3 from 'd3';

const FRAC_VIEWPOINT_AREA = 0.8;

export class Minimap {
  /** The minimap container. */
  private minimap: HTMLElement;
  /** The canvas used for drawing the mini version of the svg. */
  private canvas: HTMLCanvasElement;
  /** A buffer canvas used for temporary drawing to avoid flickering. */
  private canvasBuffer: HTMLCanvasElement;
  private download: HTMLLinkElement;
  private downloadCanvas: HTMLCanvasElement;

  /** The minimap svg used for holding the viewpoint rectangle. */
  private minimapSvg: SVGSVGElement;
  /** The rectangle showing the current viewpoint. */
  private viewpoint: SVGRectElement;
  /**
   * The scale factor for the minimap. The factor is determined automatically
   * so that the minimap doesn't violate the maximum width/height specified
   * in the constructor. The minimap maintains the same aspect ratio as the
   * original svg.
   */
  private scaleMinimap: number;
  /** The main svg element. */
  private svg: SVGSVGElement;
  /** The svg group used for panning and zooming the main svg. */
  private zoomG: SVGGElement;
  /** The zoom behavior of the main svg. */
  private mainZoom: d3.ZoomBehavior<any, any>;
  /** The maximum width and height for the minimap. */
  private maxWandH: number;
  /** The last translation vector used in the main svg. */
  private translate: [number, number];
  /** The last scaling factor used in the main svg. */
  private scaleMain: number;
  /** The coordinates of the viewpoint rectangle. */
  private viewpointCoord: {x: number; y: number};
  /** The current size of the minimap */
  private minimapSize: {width: number; height: number};
  /** Padding (px) due to the main labels of the graph. */
  private labelPadding: number;

  constructor(
    svg: SVGSVGElement,
    zoomG: SVGGElement,
    mainZoom: d3.ZoomBehavior<any, any>,
    minimap: HTMLElement,
    maxWandH: number,
    labelPadding: number
  ) {
    this.svg = svg;
    this.labelPadding = labelPadding;
    this.zoomG = zoomG;
    this.mainZoom = mainZoom;
    this.maxWandH = maxWandH;
    const $shadowRoot = d3.select(minimap.shadowRoot);
    // The minimap will have 2 main components: the canvas showing the content
    // and an svg showing a rectangle of the currently zoomed/panned viewpoint.
    const $minimapSvg = $shadowRoot.select('svg');

    // Make the viewpoint rectangle draggable.
    const $viewpoint = $minimapSvg.select('rect');
    const dragmove = d => {
      this.viewpointCoord.x = (<DragEvent>d3.event).x;
      this.viewpointCoord.y = (<DragEvent>d3.event).y;
      this.updateViewpoint();
    };
    this.viewpointCoord = {x: 0, y: 0};
    const drag = d3
      .drag()
      .subject(Object)
      .on('drag', dragmove);
    $viewpoint.datum(this.viewpointCoord as any).call(drag);

    // Make the minimap clickable.
    $minimapSvg.on('click', () => {
      if ((<Event>d3.event).defaultPrevented) {
        // This click was part of a drag event, so suppress it.
        return;
      }
      // Update the coordinates of the viewpoint.
      const width = Number($viewpoint.attr('width'));
      const height = Number($viewpoint.attr('height'));
      const clickCoords = d3.mouse($minimapSvg.node() as any);
      this.viewpointCoord.x = clickCoords[0] - width / 2;
      this.viewpointCoord.y = clickCoords[1] - height / 2;
      this.updateViewpoint();
    });
    this.viewpoint = <SVGRectElement>$viewpoint.node();
    this.minimapSvg = <SVGSVGElement>$minimapSvg.node();
    this.minimap = minimap;
    this.canvas = <HTMLCanvasElement>$shadowRoot.select('canvas.first').node();
    this.canvasBuffer = <HTMLCanvasElement>(
      $shadowRoot.select('canvas.second').node()
    );
    this.downloadCanvas = <HTMLCanvasElement>(
      $shadowRoot.select('canvas.download').node()
    );
    d3.select(this.downloadCanvas).style('display', 'none');
    this.update();
  }

  private updateViewpoint(): void {
    // Update the coordinates of the viewpoint rectangle.
    d3.select(this.viewpoint)
      .attr('x', this.viewpointCoord.x)
      .attr('y', this.viewpointCoord.y);
    // Update the translation vector of the main svg to reflect the
    // new viewpoint.
    const mainX = (-this.viewpointCoord.x * this.scaleMain) / this.scaleMinimap;
    const mainY = (-this.viewpointCoord.y * this.scaleMain) / this.scaleMinimap;
    d3.select(this.svg).call(
      this.mainZoom.transform,
      d3.zoomIdentity.translate(mainX, mainY).scale(this.scaleMain)
    );
  }

  update(): void {
    let sceneSize = null;
    try {
      // Get the size of the entire scene.
      sceneSize = this.zoomG.getBBox();
      if (sceneSize.width === 0) {
        // There is no scene anymore. We have been detached from the dom.
        return;
      }
    } catch (e) {
      // Firefox produced NS_ERROR_FAILURE if we have been
      // detached from the dom.
      return;
    }
    const $download = d3.select('#graphdownload');
    this.download = <HTMLLinkElement>$download.node();
    $download.on('click', d => {
      // Revoke the old URL, if any. Then, generate a new URL.
      URL.revokeObjectURL(this.download.href);
      // We can't use the `HTMLCanvasElement.toBlob` API because it does
      // not have a synchronous variant, and we need to update this href
      // synchronously. Instead, we create a blob manually from the data
      // URL.
      const dataUrl = this.downloadCanvas.toDataURL('image/png');
      const prefix = dataUrl.slice(0, dataUrl.indexOf(','));
      if (!prefix.endsWith(';base64')) {
        console.warn(
          `non-base64 data URL (${prefix}); cannot use blob download`
        );
        this.download.href = dataUrl;
        return;
      }
      const data = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
      const bytes = new Uint8Array(data.length).map((_, i) =>
        data.charCodeAt(i)
      );
      const blob = new Blob([bytes], {type: 'image/png'});
      this.download.href = URL.createObjectURL(blob);
    });

    const $svg = d3.select(this.svg);
    // Read all the style rules in the document and embed them into the svg.
    // The svg needs to be self contained, i.e. all the style rules need to be
    // embedded so the canvas output matches the origin.
    let stylesText = '';
    const anySvg = this.svg as any;
    // MSEdge does not have `getRootNode`. In that case, manually get the root
    // node. This is more brittle than the getRootNode as changing DOM structure
    // will break this.
    const rootNode = anySvg.getRootNode
      ? anySvg.getRootNode()
      : this.svg.parent;
    const styleSheets = rootNode.styleSheets;
    for (let k = 0; k < styleSheets.length; k++) {
      try {
        const cssRules = styleSheets[k].cssRules || styleSheets[k].rules;
        if (cssRules == null) {
          continue;
        }
        for (let i = 0; i < cssRules.length; i++) {
          // Remove tf-* selectors from the styles.
          stylesText +=
            cssRules[i].cssText.replace(/ ?tf-[\w-]+ ?/g, '') + '\n';
        }
      } catch (e) {
        if (e.name !== 'SecurityError') {
          throw e;
        }
      }
    }

    // Temporarily add the css rules to the main svg.
    const svgStyle = $svg.append('style');
    svgStyle.text(stylesText);

    // Temporarily remove the zoom/pan transform from the main svg since we
    // want the minimap to show a zoomed-out and centered view.
    const $zoomG = d3.select(this.zoomG);
    const zoomTransform = $zoomG.attr('transform');
    $zoomG.attr('transform', null);

    // https://github.com/tensorflow/tensorboard/issues/1598
    // Account for SVG content shift. SVGGraphicsElement.getBBox().width returns
    // width in pixel value of very tight bounding box of non-empty content.
    // Since we want to measure the sceneSize from the origin to the right most
    // edge of the right most node, we need to account for distance from the
    // origin to the left edge of the bounding box.
    sceneSize.height += sceneSize.y;
    sceneSize.width += sceneSize.x;
    // Since we add padding, account for that here.
    sceneSize.height += this.labelPadding * 2;
    sceneSize.width += this.labelPadding * 2;

    // Temporarily assign an explicit width/height to the main svg, since
    // it doesn't have one (uses flex-box), but we need it for the canvas
    // to work.
    $svg.attr('width', sceneSize.width).attr('height', sceneSize.height);

    // Since the content inside the svg changed (e.g. a node was expanded),
    // the aspect ratio have also changed. Thus, we need to update the scale
    // factor of the minimap. The scale factor is determined such that both
    // the width and height of the minimap are <= maximum specified w/h.
    this.scaleMinimap =
      this.maxWandH / Math.max(sceneSize.width, sceneSize.height);

    this.minimapSize = {
      width: sceneSize.width * this.scaleMinimap,
      height: sceneSize.height * this.scaleMinimap
    };

    // Update the size of the minimap's svg, the buffer canvas and the
    // viewpoint rect.
    d3.select(this.minimapSvg).attr(<any>this.minimapSize);
    d3.select(this.canvasBuffer).attr(<any>this.minimapSize);

    // Download canvas width and height are multiples of the style width and
    // height in order to increase pixel density of the PNG for clarity.
    const downloadCanvasSelection = d3.select(this.downloadCanvas);
    downloadCanvasSelection.style('width', sceneSize.width);
    downloadCanvasSelection.style('height', sceneSize.height);
    downloadCanvasSelection.attr('width', 3 * sceneSize.width);
    downloadCanvasSelection.attr('height', 3 * sceneSize.height);

    if (this.translate != null && this.zoom != null) {
      // Update the viewpoint rectangle shape since the aspect ratio of the
      // map has changed.
      requestAnimationFrame(() => this.zoom());
    }

    // TODO(stephanwlee): Consider not mutating the original DOM then read it --
    // this may cause reflow.
    // Serialize the main svg to a string which will be used as the rendering
    // content for the canvas.
    const svgXml = new XMLSerializer().serializeToString(this.svg);

    // Now that the svg is serialized for rendering, remove the temporarily
    // assigned styles, explicit width and height and bring back the pan/zoom
    // transform.
    svgStyle.remove();
    $svg.attr('width', null).attr('height', null);

    $zoomG.attr('transform', zoomTransform);
    const image = new Image();
    image.onload = () => {
      // Draw the svg content onto the buffer canvas.
      const context = this.canvasBuffer.getContext('2d');
      context.clearRect(
        0,
        0,
        this.canvasBuffer.width,
        this.canvasBuffer.height
      );
      context.drawImage(
        image,
        0,
        0,
        this.minimapSize.width,
        this.minimapSize.height
      );
      requestAnimationFrame(() => {
        // Hide the old canvas and show the new buffer canvas.
        d3.select(this.canvasBuffer).style('display', null);
        d3.select(this.canvas).style('display', 'none');
        // Swap the two canvases.
        [this.canvas, this.canvasBuffer] = [this.canvasBuffer, this.canvas];
      });
      const downloadContext = this.downloadCanvas.getContext('2d');
      downloadContext.clearRect(
        0,
        0,
        this.downloadCanvas.width,
        this.downloadCanvas.height
      );
      downloadContext.drawImage(
        image,
        0,
        0,
        this.downloadCanvas.width,
        this.downloadCanvas.height
      );
    };
    image.onerror = () => {
      const blob = new Blob([svgXml], {type: 'image/svg+xml;charset=utf-8'});
      image.src = URL.createObjectURL(blob);
    };
    image.src =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);
  }

  zoom(transform?: d3.ZoomTransform): void {
    if (this.scaleMinimap == null) {
      return;
    }
    if (transform) {
      this.translate = [transform.x, transform.y];
      this.scaleMain = transform.k;
    }
    const svgRect = this.svg.getBoundingClientRect();
    const $viewpoint = d3.select(this.viewpoint);
    this.viewpointCoord.x =
      (-this.translate[0] * this.scaleMinimap) / this.scaleMain;
    this.viewpointCoord.y =
      (-this.translate[1] * this.scaleMinimap) / this.scaleMain;
    const viewpointWidth = (svgRect.width * this.scaleMinimap) / this.scaleMain;
    const viewpointHeight =
      (svgRect.height * this.scaleMinimap) / this.scaleMain;
    $viewpoint
      .attr('x', this.viewpointCoord.x)
      .attr('y', this.viewpointCoord.y)
      .attr('width', viewpointWidth)
      .attr('height', viewpointHeight);
    const mapWidth = this.minimapSize.width;
    const mapHeight = this.minimapSize.height;
    const x = this.viewpointCoord.x;
    const y = this.viewpointCoord.y;
    const w =
      Math.min(Math.max(0, x + viewpointWidth), mapWidth) -
      Math.min(Math.max(0, x), mapWidth);
    const h =
      Math.min(Math.max(0, y + viewpointHeight), mapHeight) -
      Math.min(Math.max(0, y), mapHeight);
    const fracIntersect = (w * h) / (mapWidth * mapHeight);
    if (fracIntersect < FRAC_VIEWPOINT_AREA) {
      this.minimap.classList.remove('hidden');
    } else {
      this.minimap.classList.add('hidden');
    }
  }
}
