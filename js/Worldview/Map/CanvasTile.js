/*
 * NASA Worldview
 * 
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project. 
 *
 * Copyright (C) 2013 United States Government as represented by the 
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

Worldview.namespace("Map");

/**
 * Class: Worldview.Map.CanvasTile
 * 
 * Cavas based tile generator. The default tile generator, 
 * OpenLayers.Tile.Image renders each tile in an image element. This generator 
 * is simiar except that it uses canvas elements instead. This can be used in a 
 * layer by providing an instance at instantiation:
 *
 * (start code)
 * var myLayer = new OpenLayers.Layer.WMTS({
 *     name: "My Layer",
 *     tileClass: Worldview.Map.CanvasTile, 
 *     ...
 * });
 * (end code)
 * 
 * To apply a lookup table to dynamically change the colors of the tile, 
 * set a lookupTable property in OpenLayers.Layer with a mapping of RGBA 
 * integer values to RGBA integer values. Example:
 * 
 * (start code)
 * var grn = { r: 0x00, g: 0xff, b: 0xff, a: 0xff };
 * var red = { r: 0xff, g: 0x00, b: 0x00, a: 0xff };
 * 
 * var grnInt = ( grn.a << 24 | grn.b << 16 | grn.g << 8 | grn.r );
 * var redInt = ( red.a << 24 | grn.b << 16 | grn.g << 8 | grn.r );
 * 
 * // Map green to blue
 * myLayer.lookupTable = {
 *     grnInt: redInt
 * };
 * (end code)
 */
Worldview.Map.CanvasTile = OpenLayers.Class(OpenLayers.Tile.Image, {
	
	/*
	 * Element that contains the canvas to draw the tile. Initially set to 
	 * null and created after the tile has been loaded. Set back to null
	 * when clear() is invoked.
	 */
	canvas: null,
	cavansOriginal: null,
    graphics: null,
    grpahicsOriginal: null,
    
	initialize: function(layer, position, bounds, url, size, options) {
	    // This is required or the browser will throw security exceptions
        this.crossOriginKeyword = "anonymous";
		OpenLayers.Tile.Image.prototype.initialize.apply(this, arguments);
	},
	
	/*
     * Discards the canvas.
	 */
	destroy: function() {
		OpenLayers.Tile.Image.prototype.destroy.apply(this, arguments);	
		if ( this.canvas ) {
		    this.graphics = null;
			this.canvas = null;
			this.graphicsOriginal = null;
			this.canvasOriginal = null;
		}
	},
		
	/*
	 * Hides the canvas element and clears the image load error class if
	 * set.
	 */
	clear: function() {
		OpenLayers.Tile.Image.prototype.clear(this, arguments);
		if ( this.canvas ) {
			this.canvas.style.visibility = "hidden";
			OpenLayers.Element.removeClass(this.canvas, "olImageLoadError");
		}
	},
		
	/*
	 * Returns the canvas element by creating one if necessary. Copy over the
	 * style elements that OpenLayers.Tile.Image object applies to the image 
	 * element to the canvas element.
	 */
	getCanvas: function() {
		var image = this.getImage();
		var style;
		
		if ( !this.canvas ) {
			this.canvas = document.createElement("canvas");
			this.graphics = this.canvas.getContext("2d");
			this.canvas.id = "OpenLayers.Tile.Canvas." + this.id;
			this.canvas.className = "olTileImage";
			
			style = this.canvas.style;
			if ( this.frame ) {
				style.left = image.style.left;
				style.top = image.style.top;
				style.width = image.style.width;
				style.height = image.style.height;
			}
			style.visibility = image.style.visibility;
			style.opacity = image.style.opacity;
			style.filter = image.style.filter;
			style.position = image.style.position;
			if ( this.frame ) {
				this.frame.appendChild(this.canvas);
			}
		}
		return this.canvas;
	},
	
	/*
	 * Returns the element that contains the canvas.
	 */
	getTile: function() {
		var canvas = this.getCanvas();
		return this.frame ? this.frame : canvas;
	},
    
    onTileRendered: function(results) {
        var self = results.self;        
        var imageData = results.message.destination;
  
        self.graphics.putImageData(imageData, 0, 0); 
        
        self.canvas.style.visibility = "inherit";
        self.canvas.style.opacity = self.layer.opacity;
        self.isLoading = false;
        self.canvasContext = null;
        self.events.triggerEvent("loadend");         
    },
    
    applyLookup: function() {        
        this.canvas.style.visiblity = "hidden";
        
        var lookupTable = this.layer.lookupTable;
        var source = this.graphicsOriginal.getImageData(0, 0, this.canvas.width, 
                this.canvas.height);
        var destination = this.graphics.getImageData(0, 0, this.canvas.width,
                this.canvas.height);
            
        Worldview.Map.tileScheduler.submit({
            message: {
                lookupTable: lookupTable,
                source: source,
                destination: destination
            },
            callback: this.onTileRendered,
            self: this
        });            
    },
    
	/*
	 * Draws the loaded image to the canvas and applies a lookup table if
	 */
    onImageLoad: function() {
        OpenLayers.Event.stopObservingElement(this.imgDiv);
        
        this.canvasOriginal = document.createElement("canvas");
        this.graphicsOriginal = this.canvasOriginal.getContext("2d");
        this.canvasOriginal.width = this.imgDiv.width;
        this.canvasOriginal.height = this.imgDiv.height;
        
        var canvas = this.getCanvas();
        canvas.width = this.canvasOriginal.width;
        canvas.height = this.canvasOriginal.height;
        
	    this.graphicsOriginal.drawImage(this.imgDiv, 0, 0);
	    
		if ( this.layer.lookupTable ) {
            this.applyLookup();
		} else { 
            this.canvas.style.visibility = "inherit";
            this.canvas.style.opacity = this.layer.opacity;
            this.isLoading = false;
            this.canvasContext = null;
            this.events.triggerEvent("loadend");    		        
		}
	},
	
	/*
	 * FIXME
	 */
	onImageError: function() {
			
	},
	
	/*
	 * Name of this class per OpenLayers convention.
	 */
	CLASS_NAME: "Worldview.Map.CanvasTile"
	
});

