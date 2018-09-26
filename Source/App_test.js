(function() {
    "use strict";

    // TODO: Add your ion access token from cesium.com/ion/
    // Cesium.Ion.defaultAccessToken = '<YOUR ACCESS TOKEN HERE>';

    //////////////////////////////////////////////////////////////////////////
    // Creating the Viewer
    //////////////////////////////////////////////////////////////////////////

    var viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
            url: '//services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
        }),
        scene3DOnly: true,
        selectionIndicator: false,
        baseLayerPicker: false
    });

    //////////////////////////////////////////////////////////////////////////
    // Loading Imagery
    //////////////////////////////////////////////////////////////////////////

    // Remove default base layer
    // viewer.imageryLayers.remove(viewer.imageryLayers.get(0));

    // Add Sentinel-2 imagery
    // viewer.imageryLayers.addImageryProvider(new Cesium.IonImageryProvider({ assetId: 3954 }));

    //////////////////////////////////////////////////////////////////////////
    // Loading Terrain
    //////////////////////////////////////////////////////////////////////////

    // Load Cesium World Terrain
    viewer.terrainProvider = Cesium.createWorldTerrain({
        requestWaterMask: true, // required for water effects
        requestVertexNormals: true // required for terrain lighting
    });
    // Enable depth testing so things behind the terrain disappear.
    viewer.scene.globe.depthTestAgainstTerrain = true;

    //////////////////////////////////////////////////////////////////////////
    // Configuring the Scene
    //////////////////////////////////////////////////////////////////////////

    // Enable lighting based on sun/moon positions
    viewer.scene.globe.enableLighting = true;

    // Create an initial camera view
    var initialPosition = new Cesium.Cartesian3.fromDegrees(-73.998114468289017509, 40.674512895646692812, 2631.082799425431);
    var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(7.1077496389876024807, -31.987223091598949054, 0.025883251314954971306);
    var homeCameraView = {
        destination: initialPosition,
        orientation: {
            heading: initialOrientation.heading,
            pitch: initialOrientation.pitch,
            roll: initialOrientation.roll
        }
    };
    // Set the initial view
    viewer.scene.camera.setView(homeCameraView);

    // Add some camera flight animation options
    homeCameraView.duration = 2.0;
    homeCameraView.maximumHeight = 2000;
    homeCameraView.pitchAdjustHeight = 2000;
    homeCameraView.endTransform = Cesium.Matrix4.IDENTITY;
    // Override the default home button
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
        e.cancel = true;
        viewer.scene.camera.flyTo(homeCameraView);
    });

    // Set up clock and timeline.
    viewer.clock.shouldAnimate = true; // default
    viewer.clock.startTime = Cesium.JulianDate.fromIso8601("2017-07-11T16:00:00Z");
    viewer.clock.stopTime = Cesium.JulianDate.fromIso8601("2017-07-11T16:20:00Z");
    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601("2017-07-11T16:00:00Z");
    viewer.clock.multiplier = 2; // sets a speedup
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER; // tick computation mode
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // loop at the end
    viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime); // set visible range

    //////////////////////////////////////////////////////////////////////////
    // Loading and Styling Entity Data  with .kml .geojson .czml
    //////////////////////////////////////////////////////////////////////////

    var kmlOptions = {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas,
        clampToGround: true
    };
    // Load geocache points of interest from a KML file
    // Data from : http://catalog.opendata.city/dataset/pediacities-nyc-neighborhoods/resource/91778048-3c58-449c-a3f9-365ed203e914
    var geocachePromise = Cesium.KmlDataSource.load('./Source/SampleData/sampleGeocacheLocations.kml', kmlOptions);

    // Add geocache billboard entities to scene and style them
    geocachePromise.then(function(dataSource) {
        // Add the new data as entities to the viewer
        viewer.dataSources.add(dataSource);

        // Get the array of entities
        var geocacheEntities = dataSource.entities.values;

        for (var i = 0; i < geocacheEntities.length; i++) {
            var entity = geocacheEntities[i];
            if (Cesium.defined(entity.billboard)) {
                // Adjust the vertical origin so pins sit on terrain
                entity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                // Disable the labels to reduce clutter
                entity.label = undefined;
                // Add distance display condition
                entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(10.0, 20000.0);
                // Compute latitude and longitude in degrees
                var cartographicPosition = Cesium.Cartographic.fromCartesian(entity.position.getValue(Cesium.JulianDate.now()));
                var latitude = Cesium.Math.toDegrees(cartographicPosition.latitude);
                var longitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
                // Modify description
                var description = '<table class="cesium-infoBox-defaultTable cesium-infoBox-defaultTable-lighter"><tbody>' +
                    '<tr><th>' + "Longitude" + '</th><td>' + longitude.toFixed(5) + '</td></tr>' +
                    '<tr><th>' + "Latitude" + '</th><td>' + latitude.toFixed(5) + '</td></tr>' +
                    '</tbody></table>';
                entity.description = description;
            }
        }
    });
    /*
    // 讀取geojson裡的polygon
    // 設計讀取的參數
    var geojsonOptions = {
        clampToGround: true
    };
    // load neighborhood boundary from a GeoJson file
    // 讀取geojson file
    //先建立一個鄰居的promise物件
    var neighborhoodsPromise = Cesium.GeoJsonDataSource.load("./Source/SampleData/sampleNeighborhoods.geojson", geojsonOptions);

    // Save an new entity collection of neighborhood data
    // 從Geojson裡讀取資料建立entity
    var neighborhood;
    neighborhoodsPromise.then(function(dataSource) {
        // add the new ata as entities to the viewer
        viewer.dataSources.add(dataSource);
        neighborhood = dataSource.entities;

        // get the array of entities
        var neighborhoodEntities = dataSource.entities.values;

        for (var i = 0; i < neighborhoodEntities.length; i++) {
            var entity = neighborhoodEntities[i];

            //無法執行出隨機顏色和跑出標籤(已排除2018/9/17)
            if (Cesium.defined(entity.polygon)) {
                // Use the kml negihorhood value as entity name
                entity.name = entity.properties.neighborhood;
                // Set the polygon material to a random translucent color
                entity.polygon.material = Cesium.Color.fromRandom({
                    red: 0.1,
                    maximumGreen: 0.5,
                    minimumBlue: 0.5,
                    alpha: 0.6
                }); /// >>>>>這裡是沒問題的 ?
                // Tells the polygon to color the terrain. 
                // ClassificationType.CESIUM_3D_TILE will color the 3D tileset, and 
                // ClassificationType.BOTH will color both the 3d tiles and terrain (BOTH is the default)
                //這句的問題!!!!!  Cesium裡的method的大小寫的問題.....
                //問題JS不是會非同步執行，可是這裡沒有執行後，為什麼在這if區塊內的後面的code也一起沒有執行?
                entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
                // Generate Polygin center
                var polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
                var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
                entity.position = polyCenter;
                // Generate labels
                entity.label = {
                    text: entity.name,
                    showBackground: true,
                    scale: 0.6,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 8000.0),
                    disableDepthTestDistance: 100.0
                };

            }

        }

    });

    // Load a drone flight path from a CZML file
    // 讀取 UAV的飛行路徑
    // CZML是存取位置隨時間序列的變化 >>這裡styling 是json
    var dronePromise = Cesium.CzmlDataSource.load("./Source/SampleData/SampleFlight.czml");
    var drone;
    dronePromise.then(function(dataSource) {
        viewer.dataSources.add(dataSource);
        //Get the entity use the id denfined in the czml data
        drone = dataSource.entities.getById("Aircraft/Aircraft1");
        // add a 3D model to represent the aircraft
        // 3D模型是採用glTF(GL Transmittion Format)，可以用線上轉檔工具
        //從COLLADA 和 OBJ轉檔
        drone.model = {
            uri: "./Source/SampleData/Models/CesiumDrone.gltf",
            minimumPixelSize: 128,
            maximumPixelSize: 1000,
            silhouetteColor: Cesium.Color.WHITE,
            silhouetteSize: 2
        };
        // make aircraft fly in right orientation automaticly
        //使UAV可以自動隨路徑調整飛行方向
        drone.orientation = new Cesium.VelocityOrientationProperty(drone.position);

        // smooth interpolation
        drone.position.setInterpolationOptions({
            interpolationAlgorithm: Cesium.HermitePolynomiaApproximation,
            interpolationDegree: 2
        });

    });
    //////////////////////////////////////////////////////////////////////////
    // Load 3D Tileset
    //////////////////////////////////////////////////////////////////////////
    //Load the NYC building tileset USE Cesium3DTileset()
    var city = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({ url: Cesium.IonResource.fromAssetId(3839) }));
    // adjust the 3dtilset height to make it not float above the terrain
    var heightOffset = -32;
    city.readyPromise.then(function(tileset) {
        var boundingSphere = tileset.boundingSphere;
        var cartograhic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        var surfacePostiton = Cesium.Cartesian3.fromRadians(cartograhic.longitude, cartograhic.latitude, 0.0);
        var offsetPosition = Cesium.Cartesian3.fromRadians(cartograhic.longitude, cartograhic.latitude, heightOffset);
        var translation = Cesium.Cartesian3.subtract(offsetPosition, surfacePostiton, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix.fromTranslation(translation);

    });



    //////////////////////////////////////////////////////////////////////////
    // Style 3D Tileset
    //////////////////////////////////////////////////////////////////////////
    var defaultStyle = new Cesium.Cesium3DTileStyle({
        color: "color('white')", // color:"color('white',0.3)">> 透明度
        show: true
    });
    city.style = defaultStyle;
    var transparentStyle = new Cesium.Cesium3DTileStyle({
        color: "color('white',0.3)",
        show: true
    });
    // 依據大樓高度分類顏色
    var heightStyle = new Cesium.Cesium3DTileStyle({
        color: {
            conditions: [
                ["${height} >= 300", "rgba(45,0,75,0.5)"],
                ["${height} >= 200", "rgb(102, 71, 151)"],
                ["${height} >= 100", "rgb(170, 162, 204)"],
                ["${height} >= 50", "rgb(224, 226, 238)"],
                ["${height} >= 25", "rgb(252, 230, 200)"],
                ["${height} >= 10", "rgb(248, 176, 87)"],
                ["${height} >= 5", "rgb(198, 106, 11)"],
                ["true", "rgb(127, 59, 8)"]
            ]
        }
    });

    // Listen the HTML input to change city 3Dtilestyle
    var tileStyle = document.getElementById("tileStyle");

    function set3DTileStyle() {
        var selectedStyle = tileStyle.options[tileStyle.selectedIndex].value;
        if (selectedStyle === "none") {
            city.style = defaultStyle;
        } else if (selectedStyle === "height") {
            city.style = heightStyle;
        } else if (selectedStyle === "transparent") {
            city.style = transparentStyle;
        }
    }
    tileStyle.addEventListener("change", set3DTileStyle);


    //////////////////////////////////////////////////////////////////////////
    // Custom mouse interaction for highlighting and selecting
    //////////////////////////////////////////////////////////////////////////
    //設計互動式行為
    // 讓滑鼠移到圖釘上方會有變化
    //先宣告screenSpaceEventHandler來處理輸入user的事件
    var previousPickedEntity;
    var handler = viewer.screenSpaceEventHandler;
    //要先寫移開滑鼠時變回去的，再寫移上去的動畫
    handler.setInputAction(function(movement) {
        var pickedPrimitive = viewer.scene.pick(movement.endPosition);
        var pickedEnitiy = Cesium.defined(pickedPrimitive) ? pickedPrimitive.id : undefined;
        // ? : 是條件式 (布林值)? expression1 : expression2 ; true回傳expression1
        //highlight the currently picked entity

        // unhighlight the previous picked entity
        if (Cesium.defined(previousPickedEntity)) {
            previousPickedEntity.billboard.scale = 1.0;
            previousPickedEntity.billboard.color = Cesium.Color.WHITE;
        }

        // defined() 如果裡面的變數是defined 則回傳true
        if (Cesium.defined(pickedEnitiy) && Cesium.defined(pickedEnitiy.billboard)) {
            pickedEnitiy.billboard.scale = 2.0;
            pickedEnitiy.billboard.color = Cesium.Color.ORANGE;
            previousPickedEntity = pickedEnitiy;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    //////////////////////////////////////////////////////////////////////////
    // Setup Camera Modes
    //////////////////////////////////////////////////////////////////////////
    // write a event listener to change camera mode
    var freeModeElement = document.getElementById("freeMode");
    var droneModeElement = document.getElementById("droneMode");

    // the function of change camera mode 
    function setViewMode() {
        if (droneModeElement.checked) {
            viewer.trackedEntity = drone;
        } else {
            viewer.trackedEntity = undefined;
            viewer.scene.camera.flyTo(homeCameraView);
        }
    }

    // write the chanege
    freeModeElement.addEventListener("change", setViewMode);
    droneModeElement.addEventListener("change", setViewMode);
    // make another way to change into drone view by double click entity
    viewer.trackedEntityChanged.addEventListener(function() {
        if (viewer.trackedEntity === drone) {
            freeModeElement.checked = false;
            droneModeElement.checked = true;
        }
    });

    //////////////////////////////////////////////////////////////////////////
    // Setup Display Options
    //////////////////////////////////////////////////////////////////////////
    //想要添加一些特殊功能 1.同時隱藏所有相鄰的polygon(neighborhood polygon)
    //entity.show只能隱藏單獨的entity因此我們需要將所有同一個neighborhood的entity
    //變成一個parent entity在對他使用show
    var neighborhoodsElement = document.getElementById("neighborhoods"); //make a parent entity
    var shadowsElement = document.getElementById("shadows");

    shadowsElement.addEventListener("change", function(e) {
        viewer.shadows = e.target.checked;
    });

    neighborhoodsElement.addEventListener("change", function(e) {
        neighborhoods.show = e.target.checked;
    });

    var loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
    city.readyPromise.then(function() {
        loadingIndicator.style.display = 'none';
    });
    /*
    var shadowsElement = document.getElementById('shadows');
    var neighborhoodsElement = document.getElementById('neighborhoods');

    shadowsElement.addEventListener('change', function(e) {
        viewer.shadows = e.target.checked;
    });

    neighborhoodsElement.addEventListener('change', function(e) {
        neighborhoods.show = e.target.checked;
    });

    // Finally, wait for the initial city to be ready before removing the loading indicator.
    var loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
    city.readyPromise.then(function() {
        loadingIndicator.style.display = 'none';
    }); 
    */
}());