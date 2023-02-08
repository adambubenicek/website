FROM node:18

RUN apt update && DEBIAN_FRONTEND=noninteractive \
	&& apt install -y libxxf86vm-dev libxcursor-dev libxi-dev libxkbcommon-dev \
	chromium
	
RUN cd /usr/lib \
	&& curl https://mirrors.dotsrc.org/blender/release/Blender3.4/blender-3.4.1-linux-x64.tar.xz | tar -xJ \
	&& ln -s /usr/lib/blender-3.4.1-linux-x64/blender /usr/bin/blender

COPY . /website
WORKDIR /website

RUN npm install
