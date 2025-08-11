let gradient, unit_size; 
const OCTAVES = 6; 
const PERSISTANCE = 0.5; 
const LACUNARITY = 1.5; 

let max_amp = 0
for (let o=0; o<OCTAVES; o++) {
    max_amp += Math.pow(PERSISTANCE, o)
}
const MAX_AMP = max_amp; 

function rnd_unit() { return 2 * (Math.random() - 0.5)}

function lerp(a,b, x) {
    return a + x*(b-a)
}

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function init_perlin(width, height, unit_size_value) {
    unit_size = new Array(); 
    gradient = new Array(); 

    for (let o=0; o<OCTAVES; o++) {
        unit_size[o] = Math.ceil(unit_size_value / (Math.pow(o+1, LACUNARITY)))
        gradient[o] = new Array(); 

        let units_per_x = Math.ceil(width*4 / unit_size[o]); 
        let units_per_y = Math.ceil(height*4 / unit_size[o]); 

        for (let i=0; i<units_per_y+2; i++) {
            gradient[o][i] = new Array(); 

            for (let j=0; j<units_per_x+2; j++) {
                let x=rnd_unit(), y=rnd_unit(); 
                let norm = Math.sqrt(x*x+y*y); 
                gradient[o][i][j] = [x/norm, y/norm]; 
            }
    }
    }
}

function point_perlin(xp,yp, x,y, octave=0) {
    x /= unit_size[octave]; 
    y /= unit_size[octave]; 

    let offsets = [[],[]]
    for (let i=0; i<2; i++) {
        for (j=0; j<2; j++){
            let off = [
                x-(xp+j), 
                y-(yp+i)
            ]; 
            offsets[i][j] = off; 
        }
    }

    let dps = [[],[]]
    for (let i=0; i<2; i++) {
        for (j=0; j<2; j++) {
            let off = offsets[i][j]; 
            let grad = gradient[octave][yp+i][xp+j]; 

            dps[i][j] = off[0]*grad[0] + off[1]*grad[1]
        }
    }
    
    let u = fade(x-xp);
    let v = fade(y-yp);

    let l1 = lerp(dps[0][0], dps[0][1], u);
    let l2 = lerp(dps[1][0], dps[1][1], u);
    let l3 = lerp(l1, l2, v);

    return (l3 + 1) / 2;
}

function perlin(bmp, start_x=0, start_y=0) {
    for (let y=start_y; y<bmp.length; y++) {
        let y_point = Math.floor(y/unit_size[0]);

        for (let x=start_x; x<bmp[y].length; x++) { 
            let x_point = Math.floor(x/unit_size[0]);
            bmp[y][x] = point_perlin(x_point,y_point, x,y, 0)
        }
    }
}

function fractal_cloud(bmp, start_x=0, start_y=0, end_y=null) {
    if (end_y == null) { end_y = bmp.length; }

    for (let y=start_y; y<end_y; y++) {
        for (let x=start_x; x<bmp[0].length; x++) {
            for (let o=0; o<gradient.length; o++) {
                let y_point = Math.floor(y/unit_size[o]);
                let x_point = Math.floor(x/unit_size[o]);
                bmp[y][x] += point_perlin(x_point, y_point, x,y, o) * Math.pow(PERSISTANCE, o)
            }

            bmp[y][x] /= MAX_AMP; 
        }
    }
}