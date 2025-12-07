## Goal:

1. Render the whole Earth based on Latlng;
2. Render Tiles: whatever tiles provide it is
3. Render Vectors:
   - line
   - polygon: fill/opacity/stroke
4. Render Marker
   - latlng
5. Render 3D things
   - given a latlng and then a model (a mesh/a glb, ..etc.)

### Render the whole Earth based on Latlng;

- use `lonLatToMercator`
- use basic `Mesh/BufferGeometry/...`
