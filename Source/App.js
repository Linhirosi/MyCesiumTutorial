(function() {
    "use strict";
    /////////////////////////////
    // 設計基礎框架  
    // 初始場景 home鍵 底圖
    /////////////////////////////
    var viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
            url: '//services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
        }),
        scene3DOnly: true,
        selectionIndicator: false,
        baseLayerPicker: false,
        /*terrainProvider: new Cesium.CesiumTerrainProvider({
            url: Cesium.IonResource.fromAssetId(3956) // Alaska DSM
        }),*/

    });

    viewer.scene.globe.depthTestAgainstTerrain = true;
    // init view position
    var initView = new Cesium.Cartesian3.fromDegrees(-73.998114468289017509, 40.674512895646692812, 2631.082799425431);
    var orientOption = new Cesium.HeadingPitchRoll.fromDegrees(7, -31, 0.02); //有點不知道怎麼抓

    var homeView = {
        destination: initView,
        /*orientation: {
            heading: orientOption.heading,
            pitch: orientOption.pitch,
            roll: orientOption.roll
        }*/
    }
    viewer.scene.camera.setView(homeView);
    // home鍵要包含移動動畫才可以用flyTo()回去
    ////////////////
    //   HOME 鍵  //
    ////////////////
    homeView.duration = 2.0;
    homeView.maximumHeight = 2000;
    homeView.pitchAdjustHeight = 2000;
    homeView.endTransform = Cesium.Matrix4.IDENTITY;
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
        e.cancel = true;
        viewer.scene.camera.flyTo(homeView);
    });

    /////////////////////
    //   加入 3D KML   //
    /////////////////////
    var kmlOptions = {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas,

    };
    var geocachePromise = Cesium.KmlDataSource.load('./Source/sampleGeocacheLocations.kml', kmlOptions);
    //var geocachePromise = Cesium.KmlDataSource.load('C:/Users/林宏益/my_cesium/Build/高雄市kmz/三民_新興_苓雅3個行政局LOD1-2資料/新增資料夾/三民_新興_苓雅3個行政局LOD1-2資料/3D_KMZ/未貼圖/KMZFolder/KS3DBuilding.kml', kmlOptions);
    geocachePromise.then(function(dataSource) {
        // Add the new data as entities to the viewer
        viewer.dataSources.add(dataSource);

        // Get the array of entities

    });


}());