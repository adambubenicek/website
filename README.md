# Website

Generation script for my website, [adambubenicek.com](https://adambubenicek.com).

## Basic usage

```bash
podman build . -t website
podman run --rm -ti -p 3000:3000 website npm run build:dev && npm run serve
```

## Resources Directory

This git repo contains only sample graphic resources. To mount a `resources`
directory with actuall assets, it can be mounted to the container as a subdirectory:

```
podman run --rm -ti -v ../website_resources:/website/resources ...
```

