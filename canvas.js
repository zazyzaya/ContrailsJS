const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const FPS = 1000 / 800;  

const N_DOTS = 512; 
const MAX_SIZE = 5; 
const PLANE_SIZE = 40; 
const MS_SQ = MAX_SIZE*MAX_SIZE; 
const SQ_MS = Math.sqrt(MAX_SIZE)

const Y_SPEED = 0.05;
const X_SPEED = 0.05; 
const PLANE_ANGLE = 0; 

let start = 0; 
let dots_x = new Array(N_DOTS).fill(0); 
let dots_y = new Array(N_DOTS).fill(0);; 

let radii = new Array(N_DOTS); 
let d_radii_sum = new Array(N_DOTS).fill(0)

let mouseX = 0;
let mouseY = 0;
let selection = "cesna"; 
function change_selection(s) {
    selection=s; 
}

const CONTRAST = 2.5; 
let clouds, cloud_data = []; 
const cloudCanvas = document.createElement('canvas');
const cloudCtx = cloudCanvas.getContext('2d');
let resize_clouds = true

function clearCanvas() { 
    //ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.beginPath(); 
    ctx.fillStyle = "rgba(62, 197, 255, 1.0)"; 
    ctx.fillRect(0,0, canvas.width, canvas.height);  

    // Only calcuate once 
    // TODO recalc on resize 
    if (resize_clouds) {
        clouds = cloudCtx.createImageData(canvas.width, canvas.height); 
        
        let y_st = cloud_data.length;
        let x_st = (cloud_data.length == 0) ? 0 : cloud_data[0].length;  
        for (let y=0; y<canvas.height; y++) {
            if (y < y_st) {
                let x = x_st; 
                while (x < canvas.width) {
                    cloud_data[y][x++] = 0;
                }
            }
            else {
                cloud_data[y] = new Array(canvas.width).fill(0); 
            }
        }

        /*          x_st  canvas.width
            +--------+---+
            |  pre-  |   |
            | filled |   |
            +________+___+  y_en
            |            |
            +____________+  en_y 
        */ 
        fractal_cloud(cloud_data, start_x=x_st, start_y=0, end_y=y_st);
        fractal_cloud(cloud_data, start_x=0, start_y=y_st) // If first render y_st == canvas.height

        for (let y=0; y<canvas.height; y++) {
            for (let x=0; x<canvas.width; x++) {
                const px = cloud_data[y][x]; 

                let processed_px; 
                if (px < (1/CONTRAST)) {
                    processed_px = 0; 
                } else {
                    processed_px = (px - (1/CONTRAST)) * CONTRAST; 
                }

                let dataIndex = (y * canvas.width + x) * 4;
                clouds.data[dataIndex++] = 255; 
                clouds.data[dataIndex++] = 255; 
                clouds.data[dataIndex++] = 255; 
                clouds.data[dataIndex++] = processed_px * 255; 
            }
        }
        cloudCtx.putImageData(clouds, 0,0); 
        resize_clouds = false; 
    }

    ctx.drawImage(cloudCanvas, 0,0); 

}

// Function to resize the canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cloudCanvas.width = canvas.width;
    cloudCanvas.height = canvas.height;

    if (!resize_clouds && (
            canvas.height != cloud_data.length || 
            canvas.width != cloud_data[0].length 
        ))
    {
        resize_clouds = true; 
    } 
}

function calcDists() {
    let d, dir_x, dir_y, norm; 
    let full_dx = 0, full_dy = 0; 

    for (let i=1; i<N_DOTS; i++) {
        let true_i = (start - i) % N_DOTS; 
        let true_prev = (true_i) ? true_i-1 : 0; 
        
        // I hate how js does mod 
        if (true_i < 0) {
            true_i = (true_i + N_DOTS) % N_DOTS
        }

        d = d_radii_sum[i];
        
        // Trippy affect if this is put after this calculation 
        // dots_y[true_i] -= 0.2

        dir_x = dots_x[true_prev] - dots_x[true_i];
        dir_y = dots_y[true_prev] - dots_y[true_i];
        norm = Math.sqrt(Math.pow(dir_x, 2) + Math.pow(dir_y, 2));

        dots_y[i] -= 0.05;
        if (Math.random() > 0.5) {
            dots_x[i] -= 0.05; 
        } else {
            dots_x[i] += 0.05; 
        }

        if (norm == 0 | isNaN(norm) | !isFinite(norm)) {
            continue; 
        }

        dir_x /= norm; 
        dir_y /= norm;  

        dots_x[i] += dir_x*d; 
        dots_y[i] += dir_y*d; 
    }

    /*
    let true_prev = (start) ? start-1 : N_DOTS-1; 
    dir_x = dots_x[start] - dots_x[true_prev];
    dir_y = dots_y[start] - dots_y[true_prev];
    norm = Math.sqrt(Math.pow(dir_x, 2) + Math.pow(dir_y, 2));

    dir_x /= norm; 
    dir_y /= norm;  

    if (norm == 0 | isNaN(norm) | !isFinite(norm)) {
        return;
    }

    for (let i=1; i<N_DOTS; i++) {
        dots_x[i] += (dir_x*d + full_dx) * 0.001; 
        dots_y[i] += (dir_y*d + full_dy) * 0.001; 
    }
    */

}   

function addDot(x,y) {
    start = (start+1) % N_DOTS; 
    dots_x[start] = x; 
    dots_y[start] = y; 
}
 
let prev_angle = 0; 
function drawPlane() {
    const img = document.getElementById(selection); 

    const CLOSENESS = 10; 
    let x0,x1, y0,y1; 
    let prev = (start < CLOSENESS) ? N_DOTS-CLOSENESS : start-CLOSENESS; 
    
    x0 = dots_x[start]; x1 = dots_x[prev]; 
    y0 = dots_y[start]; y1 = dots_y[prev]; 
    
    vx = x1 - x0; 
    vy = y1 - y0; 
    dist = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2))
    if (dist < 2) {
        angle = prev_angle; 
    } else {    
        angle = Math.atan(vy/vx) + Math.PI/2; 
        if (x1 > x0) {
            angle += Math.PI; 
        }
    }

    prev_angle = angle; 
    

    ctx.save(); 
    ctx.translate(mouseX,mouseY); 
    ctx.rotate(angle); 
    ctx.drawImage(img, -PLANE_SIZE/2, -PLANE_SIZE/2, PLANE_SIZE, PLANE_SIZE); 
    ctx.restore(); 
}

function offsetNewDot() {
    let dx = (PLANE_SIZE/2) * Math.sin(prev_angle); 
    let dy = (PLANE_SIZE/2) * Math.cos(prev_angle); 
    
    dots_x[start] -= dx; 
    dots_y[start] += dy; 
}

function draw() {
    let size, x, y; 
    clearCanvas(); 
    drawPlane(); 
    offsetNewDot(); 
    calcDists(); 

    for (let i=1; i<N_DOTS+1; i++) {
        real_i = (i+start-1) % N_DOTS; 
        size = radii[i-1]

        ctx.lineWidth = size; 
        ctx.fillStyle = "#dffcfeff" // TODO fancy function on this
        x = dots_x[real_i]; 
        y = dots_y[real_i];  

        ctx.beginPath(); 
        ctx.arc(x,y, size, 0, 2 * Math.PI); 
        ctx.fill();  
    }
}

let then = 0; 
function animate() {
    requestAnimationFrame(animate); 

    now = window.performance.now(); 
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame
    if (elapsed > FPS) {
        // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
        then = now - (elapsed % FPS );

        addDot(mouseX, mouseY);
        draw(); 

    }
}

function init() { 
    for (let i=0; i<N_DOTS; i++) {
        let d_radii = new Array(N_DOTS).fill(0); 
        radii[i] = MAX_SIZE * Math.pow((i/N_DOTS), 2); 
        if (i) {
            d_radii[i] = radii[i] - radii[i-1]; 
            d_radii_sum[i] = d_radii[i] + d_radii[i-1]; 
        }
    }
    
    window.addEventListener("resize", resizeCanvas); 
    window.addEventListener("mousemove", (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    resizeCanvas();
    init_perlin(canvas.width, canvas.height, 64);
    clearCanvas(); 
    animate();
}

document.addEventListener("DOMContentLoaded", () => { init(); } ); 