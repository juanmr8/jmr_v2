const frag = `
  #ifdef GL_ES
  precision highp float;
  #endif

	${includes}

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float strength;
	uniform float dpi;

  uniform sampler2D image;

  varying vec2 v_texcoord;

  vec4 sampleColor(vec2 uv) {
    vec4 color = texture2D(image, uv);
    
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        color = vec4(0.0);
    }
    
    return color;
  }


  void main(void)
  {
    vec2 uv = (gl_FragCoord.xy - (100.0 * dpi)) / (u_resolution.xy - (200.0 * dpi)); 
    
    vec2 distortion = 0.04 * strength * vec2(
        sin(u_time + uv.x * 8.0 + uv.y * 5.0), 
        sin(u_time + uv.x * 6.0 + uv.y * 8.0)
    );
    
    distortion *= mix(0.9, 1.1, rand(uv));

		vec4 blackChannel = sampleColor(uv + distortion * rotation2d(4.0));
		blackChannel.r = 0.0;
		blackChannel.g = 0.0;
		blackChannel.b = 0.0;
    
    vec4 redChannel = sampleColor(uv + distortion * rotation2d(1.0));
    redChannel.g = 0.0;
    redChannel.b = 0.0;
		redChannel.a = redChannel.r;
    
    vec4 greenChannel = sampleColor(uv + distortion * rotation2d(2.0));
    greenChannel.r = 0.0;
    greenChannel.b = 0.0;
		greenChannel.a = greenChannel.g;
    
    vec4 blueChannel = sampleColor(uv + distortion * rotation2d(3.0));
    blueChannel.r = 0.0;
    blueChannel.g = 0.0;
		blueChannel.a = blueChannel.b;
    
    vec4 color = blackChannel + redChannel + greenChannel + blueChannel;
    
    gl_FragColor = color;
  }

`