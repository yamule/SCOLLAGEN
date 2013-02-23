/**
 * copyright: yamule
 * lisence: GPL v3
 */

/* Usage
Pass an array of hashes() to SCOLLAGEN.generateFromHash
Content of collada will be returned as string.

hash structure
hash ={

	vertex:[],//position of vertices. Please extend all coordinates in one dimension. x,y,z,x,y,z,x,y...
	vcount:[],//How many vertices are used in the face
	vindex:[],//Which vertices are used to construct the face
	norms:[],//optional- norm of each faces Please extend all coordinates in one dimension. x,y,z,x,y,z,x,y...
	color:[]//One dimensional array represents, r,g,b. <optional> if this is not defined, 255,0,0 will be used.
}

Please see
http://yamabukisoftworks.rash.jp/scolagen/index.html
for example.
*/
var SCOLLAGEN = {"SimpleColladaGenerator": 'v0' };
SCOLLAGEN.idCount = 0;
SCOLLAGEN.TYPE_GEOMETRY = 0;
SCOLLAGEN.TYPE_LAMP = 1;
SCOLLAGEN.TYPE_CAMERA = 2;


SCOLLAGEN.SimpleColladaElement  = function (t) {
	this.id_seq = SCOLLAGEN.idCount ++;
	this.id='none_'+this.id_seq;
	this.attributes = {};
	this.attributes["id"] = this.id;
	this.child = [];
	this.tagName = t||"none";
	this.innerText = null;
	this.idVisible = false;
	this.objType = null;
};

SCOLLAGEN.SimpleColladaElement.prototype = {
	constructor: SCOLLAGEN.SimpleColladaElement,
	addChild: function ( ch ) {
		if(ch == this){
			console.log(ch);
		}
		this.child.push(ch);
	},
	setIdVisible: function(b){
		this.idVisible = b;
	},
	getId: function(){
		return this.attributes["id"];
	},
	setId: function(i){
		this.setIdVisible(true);
		this.attributes["id"] = i;
	},
	setAttribute: function(k,v){
		this.attributes[k] = v; 
	},
	getAttribute: function(k){
		return this.attributes[k];
	},
	setInnerText: function(s){
		this.innerText = s;
	},
	generateAttributeLine: function(hm){
		var ret = new Array();
		ret.push(" ");
		for(var k in hm){
			ret.push(k+"=\""+hm[k]+"\" ");
		}
		return ret.join("");
	},
	removeAllChildren: function(hm){
		this.child = [];
	},
	
	generateTextCode: function(o){
		var offset = o;
		if(o == null){
			offset = "";
		}
		var ret = new Array();
		var idd = this.attributes["id"];
		if(!this.idVisible){
			delete this.attributes["id"];
		}
		ret.push(offset+"<"+this.tagName+" ");
		ret.push(this.generateAttributeLine(this.attributes));
		this.attributes["id"] = idd;
		
		if(this.child.length == 0 && this.innerText == null){
			ret.push("/>\n");
			return ret.join("");
		}
		
		ret.push(">");
		if(this.innerText != null){
			ret.push(this.innerText);
		}else{
			ret.push("\n");
		}
		for(var i = 0;i < this.child.length;i++){
			var c = this.child[i];
			ret.push(c.generateTextCode(offset+" "));
		}
		if(this.child.length > 0){
			ret.push(offset);
		}
		ret.push("</"+this.tagName+">\n");
		return ret.join("");
	}
};




SCOLLAGEN.ColladaGeometry = function (name,vertexpos,faces,norms) {
	SCOLLAGEN.SimpleColladaElement.call( this,"geometry" );
	this.setId("Geometry_"+this.id_seq);
	
	this.mesh = new SCOLLAGEN.SimpleColladaElement("mesh");
	this.source_pos = new SCOLLAGEN.SimpleColladaElement("source");
	this.float_vertex_array = new SCOLLAGEN.SimpleColladaElement("float_array");
	this.float_normal_array = new SCOLLAGEN.SimpleColladaElement("float_array");
	this.source_normal = new SCOLLAGEN.SimpleColladaElement("source");
	this.material = new SCOLLAGEN.SimpleColladaElement("polylist");
	this.materialObj = null;
	this.objType = SCOLLAGEN.TYPE_GEOMETRY;
	
	this.setAttribute("name",name);
	this.addChild(this.mesh);
	this.mesh.addChild(this.source_pos);
	this.mesh.addChild(this.source_normal);
	
	
	//---------------pos
	this.source_pos.addChild(this.float_vertex_array);
	
	this.source_pos.setId(name+"_vertex_"+this.source_pos.getId().replace("node_",""));
	this.float_vertex_array.setId(name+"_vertex_array"+this.float_vertex_array.getId().replace("node_",""));
	
	this.float_vertex_array.setIdVisible(true);
	this.float_vertex_array.setAttribute("count",""+vertexpos.length);
	this.float_vertex_array.setInnerText(SCOLLAGEN.arrayToString_float(vertexpos));
	
	var technique_common = new SCOLLAGEN.SimpleColladaElement("technique_common");
	var accessor = new SCOLLAGEN.SimpleColladaElement("accessor");
	this.source_pos.addChild(technique_common);
	technique_common.addChild(accessor);
	accessor.setAttribute("source","#"+this.float_vertex_array.getId());
	accessor.setAttribute("count",(vertexpos.length/3)+"");
	accessor.setAttribute("stride","3");
	
	var paramx = new SCOLLAGEN.SimpleColladaElement("param");
	paramx.setAttribute("name","X");
	paramx.setAttribute("type","float");
	var paramy = new SCOLLAGEN.SimpleColladaElement("param");
	paramy.setAttribute("name","Y");
	paramy.setAttribute("type","float");
	var paramz = new SCOLLAGEN.SimpleColladaElement("param");
	paramz.setAttribute("name","Z");
	paramz.setAttribute("type","float");
	
	accessor.addChild(paramx);
	accessor.addChild(paramy);
	accessor.addChild(paramz);
	
	
	
	//------------------normals
	this.source_normal.addChild(this.float_normal_array);
	this.source_normal.setId(name+"_normal_"+this.source_normal.getId().replace("node_",""));
	
	this.source_normal.setIdVisible(true);
	this.float_normal_array.setId(name+"_normal_array_"+this.float_normal_array.getId().replace("node_",""));
	this.float_normal_array.setIdVisible(true);
	this.float_normal_array.setAttribute("count",(faces.length*3)+"");
	var sb = new Array();
	
	for(var ii = 0;ii < faces.length;ii++){
		var nar;
		if(norms == null){
			nar = faces[ii].calcNorm(vertexpos);
		}else{
			nar = new Array();
			nar.push(norms[ii*3]);
			nar.push(norms[ii*3+1]);
			nar.push(norms[ii*3+2]);
		}
		for(var kk = 0;kk < nar.length;kk++){
			//file size reduction
			nar[kk] = Math.floor(nar[kk]*100000)/100000;
		}
		sb.push(SCOLLAGEN.arrayToString(nar));
		if(ii < faces.length-1){
			sb.push(" ");
		}
	}
	
	this.float_normal_array.setInnerText(sb.join(""));
	
	var tec2 = new SCOLLAGEN.SimpleColladaElement("technique_common");
	var ac2 = new SCOLLAGEN.SimpleColladaElement("accessor");
	ac2.setAttribute("source","#"+this.float_normal_array.getId());
	ac2.setAttribute("count",faces.length+"");
	ac2.setAttribute("stride","3");
	
	var paramx2 = new SCOLLAGEN.SimpleColladaElement("param");
	paramx2.setAttribute("name","X");
	paramx2.setAttribute("type","float");
	var paramy2 = new SCOLLAGEN.SimpleColladaElement("param");
	paramy2.setAttribute("name","Y");
	paramy2.setAttribute("type","float");
	var paramz2 = new SCOLLAGEN.SimpleColladaElement("param");
	paramz2.setAttribute("name","Z");
	paramz2.setAttribute("type","float");
	
	ac2.addChild(paramx2);
	ac2.addChild(paramy2);
	ac2.addChild(paramz2);
	tec2.addChild(ac2);
	this.source_normal.addChild(tec2);
	
	
	//-------vertice_tag
	var  vert = new SCOLLAGEN.SimpleColladaElement("vertices");
	vert.setId(name+"_vertices_"+vert.getId().replace("node_",""));
	vert.setIdVisible(true);
	var inp = new SCOLLAGEN.SimpleColladaElement("input");
	inp.setAttribute("semantic","POSITION");
	inp.setAttribute("source","#"+this.source_pos.getId());
	vert.addChild(inp);
	this.mesh.addChild(vert);
	
	//-----------material
	//material.setId(name+"_material_POS"+this.material.getId().replace("node_",""));
	this.material.setAttribute("material","Material_ps"+this.material.getId().replace("node_",""));
	this.material.setAttribute("count",faces.length+"");
	
	
	
	
	var inp2 = new SCOLLAGEN.SimpleColladaElement("input");
	inp2.setAttribute("semantic","VERTEX");
	inp2.setAttribute("source","#"+vert.getId());
	inp2.setAttribute("offset","0");
	var inp3 = new SCOLLAGEN.SimpleColladaElement("input");
	inp3.setAttribute("semantic","NORMAL");
	inp3.setAttribute("source","#"+this.source_normal.getId());
	inp3.setAttribute("offset","1");
	var vcou = new SCOLLAGEN.SimpleColladaElement("vcount"); //number of vertices used in the corresponding faces
	var vp = new SCOLLAGEN.SimpleColladaElement("p"); //indices of vertices used for constructing faces
	this.material.addChild(inp2);
	this.material.addChild(inp3);
	this.material.addChild(vcou);
	this.material.addChild(vp);
	this.mesh.addChild(this.material);
	
	sb = new Array();
	for(var ii = 0;ii < faces.length;ii++){
		sb.push(faces[ii].vertexIndices.length);
		if(ii < faces.length-1){
			sb.push(" ");
		}
	}
	vcou.setInnerText(sb.join(""));
	
	sb = new Array();
	for(var ii = 0;ii < faces.length;ii++){
		for(var jj = 0;jj < faces[ii].vertexIndices.length;jj++){
			sb.push(faces[ii].vertexIndices[jj]);
			sb.push(" ");
			sb.push(ii+"");
			if(ii < faces.length-1 || jj < faces[ii].vertexIndices.length-1){
				sb.push(" ");
			}
		}
	}
	vp.setInnerText(sb.join(""));
	var ex2 = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("extra",null,null,null);
	var tech3 = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("technique",null,null,null);
	tech3.setAttribute("profile","MAYA");
	var ds2 = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("double_sided",null,null,"1");
	ex2.addChild(tech3);
	tech3.addChild(ds2);
	this.addChild(ex2);
	
	
	return this;
};

SCOLLAGEN.ColladaGeometry.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );
SCOLLAGEN.ColladaGeometry.prototype.setMaterial = function(cm){
	this.materialObj = cm;
};
SCOLLAGEN.arrayToString = function(d){
	var sv = new Array();
	
	for(var ii = 0;ii < d.length;ii++){
		sv.push(""+d[ii]);
		if(ii < d.length-1){
			sv.push(" ");
		}
	}
	return sv.join("");
};

SCOLLAGEN.arrayToString_float = function(d){
	var sv = new Array();
	for(var ii = 0;ii < d.length;ii++){
		sv.push(""+(Math.floor(d[ii]*100000)/100000.0));
		if(ii < d.length-1){
			sv.push(" ");
		}
	}
	return sv.join("");
};

SCOLLAGEN.listToString = function(d){
	var sv = new Array();
	for(var ii = 0;ii < d.length;ii++){
		sv.push(""+d[ii]);
		if(ii < d.length-1){
			sv.push(" ");
		}
	}
	return sv.join("");
};





SCOLLAGEN.ColladaFace = function (i1,i2,i3,i4) {
	this.vertexIndices = [];
	this.vertexIndices[0] = i1;
	this.vertexIndices[1] = i2;
	this.vertexIndices[2] = i3;
	
	if(i4 == null){
	}else{
		this.vertexIndices[3] = i4;
	}
};



SCOLLAGEN.calcNorm = function(p1,p2,p3){
	var v1 = new Array();
	var v2 = new Array();
	var cross = new Array();
	var ret = new Array();
	for(var i = 0;i < 3;i++){
		v1[i] = p1[i] - p2[i];
	}
	for(var i = 0;i < 3;i++){
		v2[i] = p3[i] - p2[i];
	}
	
	cross[0] = v1[2]*v2[1]-v1[1]*v2[2];
	cross[1] = v1[0]*v2[2]-v1[2]*v2[0];
	cross[2] = v1[1]*v2[0]-v1[0]*v2[1];
	var len = Math.sqrt(cross[0]*cross[0]+cross[1]*cross[1]+cross[2]*cross[2]);
	if(len == 0.0){
		return null;
	}
	for(var i = 0;i < 3;i++) {
		ret[i] = cross[i]/len;
	}
	return ret;
};

SCOLLAGEN.ColladaFace.prototype.calcNorm = function(array){
	var p1 = new Array();
	var p2 = new Array();
	var p3 = new Array();
	if(this.vertexIndices.length == 3){
		p1[0] = array[this.vertexIndices[0]*3];
		p1[1] = array[this.vertexIndices[0]*3+1];
		p1[2] = array[this.vertexIndices[0]*3+2];
		
		p2[0] = array[this.vertexIndices[1]*3];
		p2[1] = array[this.vertexIndices[1]*3+1];
		p2[2] = array[this.vertexIndices[1]*3+2];
		
		p3[0] = array[this.vertexIndices[2]*3];
		p3[1] = array[this.vertexIndices[2]*3+1];
		p3[2] = array[this.vertexIndices[2]*3+2];
		return SCOLLAGEN.calcNorm(p1,p2,p3);
	}else if(this.vertexIndices.length == 4){
		p1[0] = array[this.vertexIndices[0]*3];
		p1[1] = array[this.vertexIndices[0]*3+1];
		p1[2] = array[this.vertexIndices[0]*3+2];
		
		p2[0] = array[this.vertexIndices[1]*3];
		p2[1] = array[this.vertexIndices[1]*3+1];
		p2[2] = array[this.vertexIndices[1]*3+2];
		
		p3[0] = array[this.vertexIndices[2]*3];
		p3[1] = array[this.vertexIndices[2]*3+1];
		p3[2] = array[this.vertexIndices[2]*3+2];
		var nor1 = SCOLLAGEN.calcNorm(p1,p2,p3);
		
		p1[0] = array[this.vertexIndices[1]*3];
		p1[1] = array[this.vertexIndices[1]*3+1];
		p1[2] = array[this.vertexIndices[1]*3+2];
		
		p2[0] = array[this.vertexIndices[2]*3];
		p2[1] = array[this.vertexIndices[2]*3+1];
		p2[2] = array[this.vertexIndices[2]*3+2];
		
		p3[0] = array[this.vertexIndices[3]*3];
		p3[1] = array[this.vertexIndices[3]*3+1];
		p3[2] = array[this.vertexIndices[3]*3+2];
		var nor2 = SCOLLAGEN.calcNorm(p1,p2,p3);
		/*nor1[0] = (nor1[0]+nor2[0])/2.0;
		nor1[1] = (nor1[1]+nor2[1])/2.0;
		nor1[2] = (nor1[2]+nor2[2])/2.0;
		*/
		if(nor1 == null){
			return nor2;
		}
		return nor1;
	}else{
		console.log("number of indices of this face is irregular! "+this.vertexIndices.length)
	}
	return null;

};


SCOLLAGEN.ColladaGeometryArray = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"library_geometries" );
	this.geoms = new Array();
};

SCOLLAGEN.ColladaGeometryArray.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );
SCOLLAGEN.ColladaGeometryArray.prototype.addGeometry = function(cg){
	this.addChild(cg);
};


SCOLLAGEN.ColladaMaterialArray = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"library_materials" );
	this.geoms = new Array();
};

SCOLLAGEN.ColladaMaterialArray.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );
SCOLLAGEN.ColladaMaterialArray.prototype.addMaterial = function(cm){
	this.addChild(cm);
};

SCOLLAGEN.ColladaGeometryArray.prototype.contains = function(cm){
	for(var i = 0; i < this.child.length; i++){
		if(this.child[i] === cm){
			return true;
		}
	}
	return false;
};



SCOLLAGEN.ColladaMaterial = function(e){
	SCOLLAGEN.SimpleColladaElement.call(this,"material" );
	this.setId("material_"+this.id_seq);
	this.setAttribute("name",this.getId());
	this.addEffect(e);
	
};

SCOLLAGEN.ColladaMaterial.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );

SCOLLAGEN.ColladaMaterial.prototype.addEffect = function(ce){
	if(this.effect == ce){
		return;
	}
	this.effect = ce;
	
	var co = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("instance_effect",null,null,null);
	co.setIdVisible(false);
	co.setAttribute("url","#"+ce.getId());
	this.addChild(co);
};

SCOLLAGEN.ColladaEffectArray = function(e){
	SCOLLAGEN.SimpleColladaElement.call(this,"library_effects" );

};

SCOLLAGEN.ColladaEffectArray.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );
SCOLLAGEN.ColladaEffectArray.prototype.addEffect = function(eff){
	this.addChild(eff);
};



SCOLLAGEN.colorToString = function(c){
	var d = [];
	d[0] = c.getRed()/255.0;
	d[1] = c.getGreen()/255.0;
	d[2] = c.getBlue()/255.0;
	d[3] = c.getAlpha()/255.0;
	return SCOLLAGEN.arrayToString_float(d);
};

SCOLLAGEN.Color = function(r,g,b,a){
	this.red = r;
	this.green = g;
	this.blue = b;
	this.alpha = a||255;
};
SCOLLAGEN.Color.prototype.getRed = function(){
	return this.red;
};
SCOLLAGEN.Color.prototype.getBlue = function(){
	return this.blue;
};
SCOLLAGEN.Color.prototype.getGreen = function(){
	return this.green;
};

SCOLLAGEN.Color.prototype.getAlpha = function(){
	return this.alpha;
};




SCOLLAGEN.ColladaEffect = function(emit,amb,diffu,spec,shi,reflaction){//(Color emit,Color amb,Color diffu,Color spec,double shi,int reflaction)
	SCOLLAGEN.SimpleColladaElement.call(this,"effect" );
	var prof = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("profile_COMMON",null,null,null);
	var tech = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("technique",null,null,null);
	tech.setAttribute("sid","common");
	var phong =SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("phong",null,null,null);
	prof.addChild(tech);
	tech.addChild(phong);
	this.setId("effect_"+this.id_seq);
	
	var emission =  new SCOLLAGEN.SimpleColladaElement("emission");
	var ambient =  new SCOLLAGEN.SimpleColladaElement("ambient");
	var diffuse =  new SCOLLAGEN.SimpleColladaElement("diffuse");
	var specular =  new SCOLLAGEN.SimpleColladaElement("specular");
	var shiness =  new SCOLLAGEN.SimpleColladaElement("shiness");
	var index_of_refraction =  new SCOLLAGEN.SimpleColladaElement("index_of_refraction");
	
	emission.setIdVisible(false);
	ambient.setIdVisible(false);
	diffuse.setIdVisible(false);
	specular.setIdVisible(false);
	shiness.setIdVisible(false);
	index_of_refraction.setIdVisible(false);
	
	
	phong.addChild(emission);
	phong.addChild(ambient);
	phong.addChild(diffuse);
	phong.addChild(specular);
	phong.addChild(shiness);
	phong.addChild(index_of_refraction);
	
	
	
	var cemit = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("color",null,null,SCOLLAGEN.colorToString(emit));
	cemit.setAttribute("sid","emission");
	emission.addChild(cemit);
	
	var camb = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("color",null,null,SCOLLAGEN.colorToString(amb));
	camb.setAttribute("sid","ambient");
	ambient.addChild(camb);
	
	var cdiff = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("color",null,null,SCOLLAGEN.colorToString(diffu));
	cdiff.setAttribute("sid","diffuse");
	diffuse.addChild(cdiff);
	
	
	var cspec = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("color",null,null,SCOLLAGEN.colorToString(spec));
	cspec.setAttribute("sid","specular");
	specular.addChild(cspec);
	
	
	shiness.addChild(SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("float","shininess",""+shi));
	index_of_refraction.addChild(SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("float","index_of_refraction",""+reflaction));
	
	
	
	var ex = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("extra",null,null,null);
	var techg = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("technique",null,null,null);
	techg.setAttribute("profile","GOOGLEEARTH");
	var ds = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("double_sided",null,null,"1");
	ex.addChild(techg);
	techg.addChild(ds);
	prof.addChild(ex);
	
	this.addChild(prof);
	
	var ex2 = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("extra",null,null,null);
	var tech3 = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("technique",null,null,null);
	tech3.setAttribute("profile","MAX3D");
	var ds2 = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("double_sided",null,null,"1");
	ex2.addChild(tech3);
	tech3.addChild(ds2);
	this.addChild(ex2);
};

SCOLLAGEN.ColladaEffect.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );


SCOLLAGEN.ColladaCameraArray = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"library_cameras" );
};

SCOLLAGEN.ColladaCameraArray.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );	
SCOLLAGEN.ColladaCameraArray.prototype.addCamera = function(cc){
	this.addChild(cc);
};



SCOLLAGEN.ColladaCamera = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"camera" );
	this.setId("camera_"+this.id_seq);
	this.setAttribute("name",this.getId());
	this.objType = SCOLLAGEN.TYPE_CAMERA;
};
SCOLLAGEN.ColladaCamera.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );


SCOLLAGEN.ColladaPerspectiveCamera = function(){
	SCOLLAGEN.ColladaCamera.call(this);
	this.xfov = 50.0;
	this.aspect_ratio = 1.777778;
	this.znear = 0.1;
	this.zfar = 100;
};
SCOLLAGEN.ColladaPerspectiveCamera.prototype = Object.create( SCOLLAGEN.ColladaCamera.prototype );


SCOLLAGEN.ColladaPerspectiveCamera.prototype.generateTextCode = function(offset){
	
	var optics = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("optics",null,null,null);
	var technique_common = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("technique_common",null,null,null);
	var perspective = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("perspective",null,null,null);
	var xf = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("xfov","xfov",this.xfov+"");
	var ar = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("aspect_ratio",null,null,this.aspect_ratio+"");
	var zn = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("znear","znear",this.znear+"");
	var zf = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("zfar","zfar",this.zfar+"");
	
	xf.setIdVisible(false);
	ar.setIdVisible(false);
	zn.setIdVisible(false);
	zf.setIdVisible(false);
	
	optics.addChild(technique_common);
	technique_common.addChild(perspective);
	perspective.addChild(xf);
	perspective.addChild(ar);
	perspective.addChild(zn);
	perspective.addChild(zf);
	this.removeAllChildren();
	this.addChild(optics);
	var scc  = new SCOLLAGEN.ColladaCamera();
	return scc.generateTextCode.call(this,offset);
};



SCOLLAGEN.ColladaLightArray = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"library_lights" );
};

SCOLLAGEN.ColladaLightArray.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );
SCOLLAGEN.ColladaLightArray.prototype.addLight = function(l){
	this.addChild(l);
};




SCOLLAGEN.ColladaLight = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"light" );
	this.setId("light_"+this.id_seq);
	this.setAttribute("name",this.getId());
	this.objType = SCOLLAGEN.TYPE_LAMP;
};
SCOLLAGEN.ColladaLight.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );

SCOLLAGEN.ColladaAmbientLight = function(){
	SCOLLAGEN.ColladaLight.call(this);
	this.color = new SCOLLAGEN.Color(255,255,255);
};
SCOLLAGEN.ColladaAmbientLight.prototype = Object.create( SCOLLAGEN.ColladaLight.prototype );

SCOLLAGEN.ColladaAmbientLight.prototype.generateTextCode = function(offset){
	var technique_common = ColladaElementGenerator.generateSimpleElement("technique_common",null,null,null);
	var am = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("ambient",null,null,null);
	var co = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("color","color",(color.getRed()/255.0)+" "+(color.getGreen()/255.0)+" "+(color.getBlue()/255.0));

	am.setIdVisible(false);
	co.setIdVisible(false);
	
	
	technique_common.addChild(am);
	am.addChild(co);
	this.removeAllChildren();
	this.addChild(technique_common);
	var scc = new SCOLLAGEN.ColladaLight();
	return scc.generateTextCode.call(this,offset);
};


SCOLLAGEN.ColladaPointLight = function(){
	SCOLLAGEN.ColladaLight.call(this);
	this.color = new SCOLLAGEN.Color(255,255,255);
	this.constant_attenuation = 1;
	this.linear_attenuation = 0;
	this.quadratic_attenuation = 0.00111;

};
SCOLLAGEN.ColladaPointLight.prototype = Object.create( SCOLLAGEN.ColladaLight.prototype );

SCOLLAGEN.ColladaPointLight.prototype.generateTextCode = function(offset){
	var technique_common = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("technique_common",null,null,null);
	var po = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("point",null,null,null);
	var co = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("color","color",(this.color.getRed()/255.0)+" "+(this.color.getGreen()/255.0)+" "+(this.color.getBlue()/255.0));
	var ca = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("constant_attenuation",null,null,this.constant_attenuation+"");
	var la = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("linear_attenuation",null,null,this.linear_attenuation+"");
	var qa = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("quadratic_attenuation",null,null,this.quadratic_attenuation+"");
	
	co.setIdVisible(false);
	ca.setIdVisible(false);
	la.setIdVisible(false);
	qa.setIdVisible(false);
	
	
	
	technique_common.addChild(po);
	po.addChild(co);
	po.addChild(ca);
	po.addChild(la);
	po.addChild(qa);
	this.removeAllChildren();
	this.addChild(technique_common);
	var scc = new SCOLLAGEN.ColladaLight();
	return scc.generateTextCode.call(this,offset);
};


SCOLLAGEN.LightExtraObject = function(tag,pf){
	SCOLLAGEN.SimpleColladaElement.call(this,tag);
	this.setAttribute("profile",pf);
	this.elements = {};
};

SCOLLAGEN.LightExtraObject.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );
SCOLLAGEN.LightExtraObject.prototype.addElement = function(k,s){
	this.elements[k] = s;
};
SCOLLAGEN.LightExtraObject.prototype.generateTextCode = function(offset){
	var ret = new Array();
	ret.push("\n");
	for(var kk in this.elements){
		var tag = kk.replace(/ .+/g,"");
		ret.push("<"+kk+">"+this.elements.get(kk)+"</"+tag+">\n");
	}
	this.setInnerText(ret.join(""));
	var scc = new SCOLLAGEN.SimpleColladaElement();
	return scc.generateTextCode(this,offset);
};




SCOLLAGEN.ColladaLibraryScene = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"library_visual_scenes");
	this.objects = new Array();
};

SCOLLAGEN.ColladaLibraryScene.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );
SCOLLAGEN.ColladaLibraryScene.prototype.addVisualScene = function(vc){
	this.addChild(vc);
};



SCOLLAGEN.ColladaVisualScene = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"visual_scene");
	this.setId("vscene_"+this.id_seq);
	this.setAttribute("name",this.getId());
};
SCOLLAGEN.ColladaVisualScene.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );


SCOLLAGEN.ColladaVisualScene.prototype.add = function(cg,trans){
		this.child.push(new SCOLLAGEN.ColladaSceneObjectNode(cg,trans));
};




SCOLLAGEN.ColladaObjectTransformer = function(l,rz,ry,rx,sc){
	SCOLLAGEN.SimpleColladaElement.call(this,"dummy");
	this.location =  new Array(0,0,0,0);
	this.rotationZ = new Array(0,0,1,0);
	this.rotationY = new Array(0,1,0,0);
	this.rotationX = new Array(1,0,0,0);
	this.scale = new Array(1,1,1);
	
	
	
	if(l != null){
		this.location = l.slice(0);
	}
	
	if(rz != null){
		this.rotationZ = rz.slice(0);
	}
	
	if(ry != null){
		this.rotationY = ry.slice(0);
	}
	
	if(rx != null){
		this.rotationX = rx.slice(0);
	}
	
	if(sc != null){
		this.scale = sc.slice(0);
	}
	
	
};
SCOLLAGEN.ColladaObjectTransformer.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );

SCOLLAGEN.ColladaObjectTransformer.prototype.setLocation = function(d1,d2,d3){
	this.location[0] = d1;
	this.location[1] = d2;
	this.location[2] = d3;
};
SCOLLAGEN.ColladaObjectTransformer.prototype.setRotationZ = function(d1,d2,d3,d4){
	this.rotationZ[0] = d1;
	this.rotationZ[1] = d2;
	this.rotationZ[2] = d3;
	this.rotationZ[3] = d4;
};
SCOLLAGEN.ColladaObjectTransformer.prototype.setRotationY = function(d1,d2,d3,d4){
	this.rotationY[0] = d1;
	this.rotationY[1] = d2;
	this.rotationY[2] = d3;
	this.rotationY[3] = d4;
};
SCOLLAGEN.ColladaObjectTransformer.prototype.setRotationX = function(d1,d2,d3,d4){
	this.rotationX[0] = d1;
	this.rotationX[1] = d2;
	this.rotationX[2] = d3;
	this.rotationX[3] = d4;
};


SCOLLAGEN.ColladaObjectTransformer.prototype.setScale = function(d1,d2,d3){
	this.scale[0] = d1;
	this.scale[1] = d2;
	this.scale[2] = d3;
};
SCOLLAGEN.ColladaObjectTransformer.prototype.join = function(d){
	var sb = new Array();
	for(var ii = 0;ii < d.length;ii++){
		sb.push(d[ii]+"");
		if(ii != d.length-1){
			sb.push(" ");
		}
	}
	return sb.join("");
};

SCOLLAGEN.ColladaObjectTransformer.prototype.generateTextCode = function(offset){
	var ret = new Array();
	this.removeAllChildren();
	this.child.push(SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("translate","location",this.join(this.location)));
	this.child.push(SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("rotate","rotationZ",this.join(this.rotationZ)));
	this.child.push(SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("rotate","rotationY",this.join(this.rotationY)));
	this.child.push(SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("rotate","rotationX",this.join(this.rotationX)));
	this.child.push(SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid("scale","scale",this.join(this.scale)));
	
	
	for(var i = 0;i < this.child.length;i++){
		var c = this.child[i];
		ret.push(c.generateTextCode(offset+" "));
	}
	return ret.join("");
};


SCOLLAGEN.ColladaSceneObjectNode = function(e,t){
	SCOLLAGEN.SimpleColladaElement.call(this,"node");
	this.tansformer = t;
	this.setAttribute("type","NODE");
	this.type = e.objType;
	switch (e.objType){
		case SCOLLAGEN.TYPE_GEOMETRY:
			this.setId("GeomNode_"+this.id_seq);
			this.setAttribute("name",this.getId());
			var instance_geometry = new SCOLLAGEN.SimpleColladaElement("instance_geometry");
			instance_geometry.setAttribute("url","#"+e.getId());
			var bind_material = new SCOLLAGEN.SimpleColladaElement("bind_material");
			var technique_common = new SCOLLAGEN.SimpleColladaElement("technique_common");
			var instance_material = new SCOLLAGEN.SimpleColladaElement("instance_material");
			instance_material.setAttribute("symbol",e.material.getAttribute("material"));
			instance_material.setAttribute("target","#"+e.materialObj.getId());
			
			instance_geometry.addChild(bind_material);
			bind_material.addChild(technique_common);
			technique_common.addChild(instance_material);
			
			this.addChild(t);
			this.addChild(instance_geometry);
		break;
		case SCOLLAGEN.TYPE_LAMP:
			this.setId("LampNode_"+this.id_seq);
			this.setAttribute("name",this.getId());
			var instance_light = new SCOLLAGEN.SimpleColladaElement("instance_light");
			instance_light.setAttribute("url","#"+e.getId());
			this.addChild(t);
			this.addChild(instance_light);
		break;
		case SCOLLAGEN.TYPE_CAMERA:
			this.setId("CameraNode_"+this.id_seq);
			var instance_camera = new  SCOLLAGEN.SimpleColladaElement("instance_camera");
			this.setAttribute("name",this.getId());
			instance_camera.setAttribute("url","#"+e.getId());
			this.addChild(t);
			this.addChild(instance_camera);
		break;
	}
	
};
SCOLLAGEN.ColladaSceneObjectNode.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );



SCOLLAGEN.ColladaElementGenerator = {};
SCOLLAGEN.ColladaElementGenerator.generateSimpleElement_sid =  function(tagname,sid,innertext){
	var ret = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement(tagname,null,null,innertext);
	ret.setAttribute("sid",sid);
	return ret;
};
SCOLLAGEN.ColladaElementGenerator.generateSimpleElement =  function(tagname,idchange,att,innertext){
	var ret = new SCOLLAGEN.SimpleColladaElement(tagname);
	if(idchange != null){
		ret.setId(idchange+"_"+ret.getId().replace("node_",""));
	}
	if(att != null){
		for(var n in att){
			ret.setAttribute(n,att.get(n));
		}
	}
	if(innertext != null && innertext.length > 0){
		ret.setInnerText(innertext);
	}
	return ret;
};



SCOLLAGEN.ColladaXML = function(){
	SCOLLAGEN.SimpleColladaElement.call(this,"COLLADA");
	this.geometries = new SCOLLAGEN.ColladaGeometryArray();
	this.effects = new SCOLLAGEN.ColladaEffectArray();
	this.materials = new SCOLLAGEN.ColladaMaterialArray();
	this.libscene = new SCOLLAGEN.ColladaLibraryScene();
	this.scene = new SCOLLAGEN.ColladaVisualScene();
	this.lights = new SCOLLAGEN.ColladaLightArray();
	this.cameras = new SCOLLAGEN.ColladaCameraArray();
	
	
	this.setAttribute("xmlns","http://www.collada.org/2005/11/COLLADASchema");
	this.setAttribute("version","1.4.1");
	this.setIdVisible(false);
	this.libscene.addVisualScene(this.scene);
	
	this.addChild(this.geometries);
	this.addChild(this.effects);
	this.addChild(this.materials);
	this.addChild(this.lights);
	this.addChild(this.cameras);
	this.addChild(this.libscene);
	
	
	var scene_tag = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("scene",null,null,null);
	var scene_instance = SCOLLAGEN.ColladaElementGenerator.generateSimpleElement("instance_visual_scene",null,null,null);
	scene_instance.setAttribute("url","#"+this.scene.getId());
	scene_tag.addChild(scene_instance);
	this.addChild(scene_tag);
	
	
};
SCOLLAGEN.ColladaXML.prototype = Object.create( SCOLLAGEN.SimpleColladaElement.prototype );


//SCOLLAGEN.ColladaXML.prototype.addGeometry = function(cg,m,trans){
SCOLLAGEN.ColladaXML.prototype.addGeometry = function(p1,p2,p3){
	if(p3 == null){
		this.geometries.addChild(p1);
		this.scene.add(p1,p2);
		this.addMaterial(p1.materialObj);
	}else{
		this.geometries.addChild(p1);
		this.scene.add(p1,p3);
		cg.setMaterial(p2);
		this.addMaterial(p2);
	}
};

SCOLLAGEN.ColladaXML.prototype.addLight = function(light,trans){
	this.lights.addLight(light);
	this.scene.add(light,trans);
};
SCOLLAGEN.ColladaXML.prototype.addCamera = function(perc,trans){
	this.cameras.addCamera(perc);
	this.scene.add(perc,trans);
};
	
SCOLLAGEN.ColladaXML.prototype.addMaterial = function(cm){
	for(var i = 0;i < this.materials.length;i++){
		if(this.materials[i] == cm){
			return;
		}
	}
	this.materials.addMaterial(cm);
	this.effects.addEffect(cm.effect);
};

SCOLLAGEN.ColladaXML.prototype.addDefaultCamera = function(){
	var perc = new SCOLLAGEN.ColladaPerspectiveCamera();
	var cloc = new Array(0,-6.50764,5.343665);
    var crz = new Array(0,0,1,46.69195);
    var cry = new Array(0,1,0, 0.619768);
    var crx = new Array(1,0,0,63.5593);
    var csc = new Array(1,1,1);
	var cameratrans = new SCOLLAGEN.ColladaObjectTransformer(cloc,crz,cry,crx,csc);
	this.addCamera(perc,cameratrans);
	
};
SCOLLAGEN.ColladaXML.prototype.addDefaultLight = function(){
	var pointlight = new SCOLLAGEN.ColladaPointLight();
	var lloc = new Array(4.076245,1.005454,5.903862);
	var lrz = new Array(0,0,1,107);
	var lry = new Array(0,1,0,3.16);
	var lrx = new Array(1,0,0,37.3);
	var lsc = new Array(1,1,1);
	var lighttrans = new SCOLLAGEN.ColladaObjectTransformer(lloc,lrz,lry,lrx,lsc);
	this.addLight(pointlight,lighttrans);
};




/*
	public void save(String filename){
		try{
			
			BufferedWriter bw = new BufferedWriter(new FileWriter(new File(filename)));
			bw.write(getXMLDescription()+"\n");
			bw.write(generateTextCode());
			bw.close();
		}catch(Exception exx){
			exx.printStackTrace();
		}
	}
*/
	
SCOLLAGEN.ColladaXML.prototype.getXMLDescription = function(){
	return "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
};
	
	
	
	


SCOLLAGEN.MeshGenerator = {};
	
SCOLLAGEN.MeshGenerator.generate = function(vertices,vertexmap,facenum){
	var ret = new SCOLLAGEN.SimpleMesh3D();
	try{
		ret.setVertex(vertices);
		var cou = 0;
		for(var ii = 0;ii < facenum.length;ii++){
			
			if(facenum[ii] == 3){
				ret.addFace(vertexmap[cou],vertexmap[cou+1],vertexmap[cou+2]);
				cou += 3;
			}else{
				ret.addFace(vertexmap[cou],vertexmap[cou+1],vertexmap[cou+2],vertexmap[cou+3]);
				cou += 4;
			}
		}
	}catch(e){
		console.log(e);
		return null;
	}
	return ret;
};

	
	
SCOLLAGEN.ArrayProcess = {};
SCOLLAGEN.ArrayProcess.add = function(p1,p2,subtract){
	var ret = new Array();
	for(var ii = 0;ii < p1.length;ii++){
		if(subtract == null || subtract == false){
			ret[ii] = p1[ii]+p2[ii];
		}else{
			ret[ii] = p1[ii]-p2[ii];
		}
	}
	return ret;
};
SCOLLAGEN.ArrayProcess.subtract = function(p1,p2){
	return SCOLLAGEN.ArrayProcess.add(p1,p2,true);
};

SCOLLAGEN.ArrayProcess.multi = function(p1,m){
	var ret = new Array();
	for(var ii = 0;ii < p1.length;ii++){
		ret[ii] = p1[ii]*m;
	}
	return ret;
};


	
	
SCOLLAGEN.MeshGenerator.lineToBox = function(p1,p2,width){
	var v1 = SCOLLAGEN.ArrayProcess.subtract(p2,p1);
	var v2 = new Array();
	var v3 = new Array();
	v3[0] = 0;
	v3[1] = 0;
	v3[2] = 0;
	
	if(v1[0] != 0){
		v2[0] = 0;
		v2[1] = 0;
		v2[2] = 1;
	}else{
		v2[0] = 1;
		v2[1] = 0;
		v2[2] = 0;
	}
	var norm = [];
	norm[0] = SCOLLAGEN.ArrayProcess.multi(SCOLLAGEN.calcNorm(v1,v3,v2),width/2.0);
	norm[1] = SCOLLAGEN.ArrayProcess.multi(SCOLLAGEN.calcNorm(v1,v3,norm[0]),width/2.0);
	norm[2] = SCOLLAGEN.ArrayProcess.multi(norm[0],-1);
	norm[3] = SCOLLAGEN.ArrayProcess.multi(norm[1],-1);
	
	var face1 = new Array();
	var face2 = new Array();
	
	for(var i = 0;i < 4;i++){
		for(var j = 0;j < 3;j++){
			face1.push(norm[i][j]);
		}
	}
	face2 = face1.slice(0);
	
	for(var ii = 0;ii < 4;ii++){
		face2[ii*3] += p2[0];
		face2[ii*3+1] += p2[1];
		face2[ii*3+2] += p2[2];
		face1[ii*3] += p1[0];
		face1[ii*3+1] += p1[1];
		face1[ii*3+2] += p1[2];
	}
	
	var vertices = [];
	
	for(var i = 0;i < 12;i++){
		vertices[i] = face1[i];
	}
	
	for(var i = 0;i < 12;i++){
		vertices[i+12] = face2[i];
	}
	
	
	var al = new Array();
	for(var ii = 0;ii < 4;ii++){
		al.push(new SCOLLAGEN.ColladaFace(ii,(ii+1)%4,(ii+1)%4+4,ii+4));
	}
	al.push(new SCOLLAGEN.ColladaFace(0,1,2,3));
	al.push(new SCOLLAGEN.ColladaFace(4,5,6,7));
	
	return new SCOLLAGEN.SimpleMesh3D(vertices,al);
	
};


SCOLLAGEN.SimpleMesh3D = function(d,al){
	this.vertices = new Array();
	this.faces = new Array();
	this.norms = null;
	if(d == null){
	}else{
		this.setVertex(d);
		this.faces = al.slice(0);
	}

};

	
SCOLLAGEN.SimpleMesh3D.prototype.setVertex = function(d){
	this.vertices = [];
	for(var ii = 0;ii < d.length;ii++){
		this.vertices[ii] = d[ii];
	}
};


SCOLLAGEN.SimpleMesh3D.prototype.addFace = function(p1,p2,p3,p4){
	if(p4 == null){
		this.faces.push(new SCOLLAGEN.ColladaFace(p1,p2,p3));
	}else{
		this.faces.push(new SCOLLAGEN.ColladaFace(p1,p2,p3,p4));
	}
};


SCOLLAGEN.SimpleMesh3D.prototype.setNorms = function(normarray){
	this.norms = new Array();
	for(var ii = 0;ii < normarray.length;ii++){
		this.norms.push(normarray[ii]);
	}
};

SCOLLAGEN.SimpleMesh3D.prototype.concatenate = function(sm){
	var tmp = new Array();
	for(var i = 0;i < this.vertices.length;i++){
		tmp.push(this.vertices[i]);
	}
	
	for(var i = 0;i < sm.vertices.length;i++){
		tmp.push(sm.vertices[i]);
	}
	var vertexshift = this.vertices.length/3;
	for(var cf in sm.faces){
		for(var ii = 0;ii < cf.vertexIndices.length;ii++){
			cf.vertexIndices[ii] = cf.vertexIndices[ii]+vertexshift;
		}
		this.faces.push(cf);
	}
	this.vertices = tmp.slice(0);
};

SCOLLAGEN.generateFromHash = function(al){
/*
array of hash
hash ={
	vertex:[],//position of vertices. Please extend all coordinates in one dimension. x,y,z,x,y,z,x,y...
	vcount:[],//How many vertices are used in the face
	vindex:[],//Which vertices are used to construct the face
	norms:[],//optional- norm of each faces Please extend all coordinates in one dimension. x,y,z,x,y,z,x,y...
	color:[]//One dimensional array represents, r,g,b. <optional> if this is not defined, 255,0,0 will be used.
}
*/
	var cxml = new SCOLLAGEN.ColladaXML();
	for(var i = 0;i < al.length;i++){
		var mesh = SCOLLAGEN.MeshGenerator.generate(al[i]["vertex"],al[i]["vindex"],al[i]["vcount"]);
		if(al[i]["norms"] != null){
			mesh.setNorms(al[i]["norms"] );
		}
		var geom = new SCOLLAGEN.ColladaGeometry("Geom_"+i,mesh.vertices,mesh.faces,mesh.norms);
		
		var col = [];
		if(al[i]["color"] != null){
			col = al[i]["color"];
		}else{
			col[0] = 255;
			col[1] = 0;
			col[2] = 0;
			
		}
		var ce = new SCOLLAGEN.ColladaEffect(new SCOLLAGEN.Color(128,128,128,255),new SCOLLAGEN.Color(128,128,128,255),new SCOLLAGEN.Color(col[0],col[1],col[2]),new SCOLLAGEN.Color(255,255,255),25,1);
		var cm = new SCOLLAGEN.ColladaMaterial(ce);
		geom.setMaterial(cm);
		cxml.addGeometry(geom,new SCOLLAGEN.ColladaObjectTransformer());
		
	}
	
	cxml.addDefaultLight();
	cxml.addDefaultCamera();
	var sb = new Array();
	sb.push(cxml.getXMLDescription()+"\n");
	sb.push(cxml.generateTextCode());
	return sb.join("");
};
