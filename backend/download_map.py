import osmnx as ox

print("KKTC yol ağı indiriliyor...")
G = ox.graph_from_place("Northern Cyprus", network_type="drive")

nodes, edges = ox.graph_to_gdfs(G)

edges_reset = edges.reset_index()
edges_reset = edges_reset[["geometry", "name", "highway", "maxspeed", "lanes", "oneway"]]
edges_reset.to_file("data/kktc_roads.geojson", driver="GeoJSON")

print(f"✅ {len(edges)} yol segmenti indirildi.")
print(f"✅ data/kktc_roads.geojson kaydedildi.")