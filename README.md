#SCOLLAGEN
=========

Simple Javascript-base collada exporter
which enables you to generate collada file with modern web-browser.

Pass an array of hashes() to SCOLLAGEN.generateFromHash
Content of collada will be returned as string.

hash structure like

    hash ={
        vertex:[],//position of vertices. Please extend all coordinates in one dimension. x,y,z,x,y,z,...
        vcount:[],//How many vertices are used in the face
        vindex:[],//Which vertices are used to construct the face
        norms:[],//<optional> norm of each faces Please extend all coordinates in one dimension. x,y,z,x,y,z,...
        color:[]//<optional> One dimensional array represents, r,g,b. If ommitted, 255,0,0 will be used.
    }


#Example
If you made models with three.js by mrdoob,
and you added objects directly under the scene object,

1. Make an element whose id is "dldiv" in your HTML document.
2. Define functions 'makeCollada' and 'makeDLLink' as follows.
    
    function makeCollada(){
        var ar = scene.__objects;
        var glen = ar.length;
		var geoms = new Array();
		//console.log(ar.length);
		for(var i = 0;i < glen;i++){
			if(ar[i].geometry != null){
				if(ar[i].visible == false){
						continue;
					}
				var geo = ar[i].geometry;
				//console.log(geo.vertices.length);
				var varray = new Array();
				var farray = new Array();
				var fnumarray = new Array();
				var vlen = geo.vertices.length;
				var roundnum = 10000000;
				for(var j = 0;j < vlen;j++){
					varray.push(Math.round(geo.vertices[j].x*roundnum)/roundnum);
					varray.push(Math.round(geo.vertices[j].y*roundnum)/roundnum);
					varray.push(Math.round(geo.vertices[j].z*roundnum)/roundnum);
				}
				var flen = geo.faces.length;
				for(var j = 0;j < flen;j++){
					farray.push(geo.faces[j].a);
					farray.push(geo.faces[j].b);
					farray.push(geo.faces[j].c);
					if(geo.faces[j].d == null){
						fnumarray.push(3);
					}else{
						farray.push(geo.faces[j].d);
						fnumarray.push(4);
					}
				}
				var mtcolor = new Array(255,0,0);
			
			    if(ar[i].material != null){
                    if(ar[i].material.color != null){
					    var r = Math.min(Math.floor(ar[i].material.color.r*256),255);
						var g = Math.min(Math.floor(ar[i].material.color.g*256),255);
						var b = Math.min(Math.floor(ar[i].material.color.b*256),255);
						mtcolor[0] = r;
						mtcolor[1] = g;
						mtcolor[2] = b;
					}
				}
				var ha ={
					vertex:varray,
					vindex:farray,
					vcount:fnumarray,
					color:mtcolor
				
				};
				geoms.push(ha);
			}
		}
		var dlc  = document.getElementById("dldiv");
		if(dlc.childNodes.length > 0){
			dlc.removeChild(dlc.childNodes[0]);
		}
		dlc.appendChild(makeDLLink(SCOLAGEN.generateFromHash(geoms)));
	};
	function makeDLLink(dat) {
		var c = (window.URL || window.webkitURL).createObjectURL(new Blob([dat]))
		var ret = document.createElement("a");
	    ret.setAttribute("href", c);
		ret.innerHTML = "Download";
		return ret;
	};
3. Call makeCollada.

Then a link will be appear in the element you made in step 1.
