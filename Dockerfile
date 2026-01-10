FROM node:22-bookworm-slim

LABEL org.opencontainers.image.source="https://github.com/pixlcore/xyops"
LABEL org.opencontainers.image.description="A complete task scheduler and server monitoring system."
LABEL org.opencontainers.image.licenses="BSD-3-Clause"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
	zip unzip xz-utils bzip2 procps lsof \
    iputils-ping \
    dnsutils \
    openssh-client \
    net-tools \
    curl \
    wget \
    vim \
    less \
    sudo \
	iproute2 \
	tzdata \
	build-essential \
	python3 \
	python3-distutils \
    python3-setuptools \
    pkg-config \
	libc6-dev \
	libssl-dev \
	zlib1g-dev \
	libffi-dev \
	git \
	ca-certificates \
	gnupg

# install docker cli
RUN . /etc/os-release; \
  install -m 0755 -d /etc/apt/keyrings; \
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc; \
  chmod a+r /etc/apt/keyrings/docker.asc; \
  ARCH=$(dpkg --print-architecture); \
  echo "deb [arch=$ARCH signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/$ID ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list; \
  apt-get update && apt-get install -y --no-install-recommends docker-ce-cli;

# cleanup apt
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
RUN mv /root/.local/bin/uv /usr/local/bin/uv
RUN mv /root/.local/bin/uvx /usr/local/bin/uvx

WORKDIR /opt/xyops
COPY . .

ENV XYOPS_foreground=true
ENV XYOPS_color=true
ENV XYOPS_echo="xyOps Transaction Error error API Unbase Action Comm Job Workflow Maint Multi Scheduler SSO User Ticket Alert"

RUN npm install

# Fix permission issue with useragent-ng (sigh)
RUN chmod 644 node_modules/useragent-ng/lib/regexps.js

RUN node bin/build.js dist

# install xysat locally
RUN mkdir /opt/xyops/satellite; \
  cd /opt/xyops/satellite; \
  curl -L https://github.com/pixlcore/xysat/archive/main.tar.gz | tar zxvf - --strip-components 1; \
  npm install; \
  cd /opt/xyops;

RUN mkdir -p data
VOLUME /opt/xyops/data

RUN mkdir -p logs
RUN mkdir -p temp

EXPOSE 5522/tcp
EXPOSE 5523/tcp

CMD ["bash", "bin/container-start.sh"]
