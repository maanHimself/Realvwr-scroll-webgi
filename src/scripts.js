import {
  ViewerApp,
  AssetManagerPlugin,
  GBufferPlugin,
  timeout,
  ProgressivePlugin,
  TonemapPlugin,
  SSRPlugin,
  SSAOPlugin,
  DiamondPlugin,
  mobileAndTabletCheck,
  FrameFadePlugin,
  GLTFAnimationPlugin,
  GroundPlugin,
  BloomPlugin,
  TemporalAAPlugin,
  AnisotropyPlugin,
  GammaCorrectionPlugin,
  CameraViewPlugin,
  MaterialConfiguratorBasePlugin,
  addBasePlugins,
  ITexture,
  TweakpaneUiPlugin,
  AssetManagerBasicPopupPlugin,
  CanvasSnipperPlugin,
  // DepthOfFieldPlugin,
  BufferGeometry,
  MeshStandardMaterial2,
  RandomizedDirectionalLightPlugin,
  AssetImporter,
  Color,
  Mesh,
  html,
  diamondMaterialPropList,
  Material,
  MaterialManager,
  NormalBufferPlugin,
  MaterialConfiguratorPlugin,
  MeshNormalMaterial,
  SSBevelPlugin,
  CameraView,
  EasingFunctions,
  EnvironmentPresetGroup,
  ScrollableCameraViewPlugin,
} from "webgi";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles.css";

gsap.registerPlugin(ScrollTrigger);

class CustomMaterialConfiguratorPlugin extends MaterialConfiguratorBasePlugin {
  // This must be set to exactly this.
  static PluginType = "MaterialConfiguratorPlugin";

  // this function is automatically called when an object is loaded with some material variations
  async _refreshUi() {
    if (!(await super._refreshUi())) return false; // check if any data is changed.
    const configuratorDiv = document.getElementById("configurator");

    configuratorDiv.innerHTML = "";
    let buttonid = 0;

    for (const variation of this.variations) {
      buttonid = buttonid + 1;
      const container = document.createElement("div");
      container.classList.add("variations");
      container.classList.add(
        variation.title === "Gem" ? "footer-container-diamond-color" : "footer-container-ring-colors"
      );
      container.id = variation.title;
      // container.textContent = variation.title;
      configuratorDiv.appendChild(container);

      variation.materials.map((material) => {
        // material is the variation that can be applied to an object

        let image;
        // if (!variation.preview.startsWith('generate:')) {
        //     const pp = material[variation.preview] || '#ff00ff'
        //     image = pp.image || pp
        // }

        // callback to change the material variations
        const onClick = () => {
          document.querySelectorAll(".configurator-button").forEach((el) => {
            el.classList.remove("active");
          });
          document.getElementById(material.name).classList.add("active");
          this.applyVariation(variation, material.uuid);
        };
        // Generate a UI from this data.
        // variations
        const button = document.createElement("li");
        button.classList.add("configurator-button");
        button.id = material.name;
        button.innerHTML = `
                    <div id="tooltipOne" class="tooltip">
                    ${material.name}
                    </div>
                    <img alt="${material.name}" width="40" height="40" src="assets/images/${material.name}.png">`;
        button.style.position = "relative";
        button.onclick = onClick;
        container.append(button);
      });
      const closeButton = document.createElement("li");
      closeButton.id = variation.uuid + "1";
      closeButton.style.position = "relative";
      closeButton.innerHTML = `<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15 9l-6 6M9 9l6 6" stroke="#52322B" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      container.append(closeButton);
    }
    return true;
  }
}

async function setupViewer() {
  const canvasView = document.getElementById("webgi-canvas");
  const canvasContainer = document.getElementById("webgi-canvas-container");
  const buttonExit = document.querySelector(".button-exit");
  const isMobile = mobileAndTabletCheck();
  const CustomizerInterface = document.querySelector(".footer-container");
  // let nightModeButton = document.querySelector(".dark-mode")
  // let musicButton = document.querySelector(".music-control")
  let diamondColors = document.querySelector(".footer-diamond-colors");
  let ringColors = document.querySelector(".footer-ring-colors");
  let bodyDocument = document.getElementById("body");
  let htmlDocument = document.getElementById("html");
  // let nightMode = false
  let firstLooad = true;

  // Initialize the viewer
  const viewer = new ViewerApp({
    canvas: document.getElementById("webgi-canvas"),
    useRgbm: true,
  });

  // Add some plugins
  const manager = await viewer.addPlugin(AssetManagerPlugin);
  const scroller = await viewer.addPlugin(ScrollableCameraViewPlugin);
  const camera = viewer.scene.activeCamera;
  const position = camera.position;
  const target = camera.target;

  // Add all the plugins at once
  await addBasePlugins(viewer);

  // await viewer.addPlugin(MaterialConfiguratorPlugin)

  await viewer.addPlugin(CustomMaterialConfiguratorPlugin);

  await viewer.addPlugin(NormalBufferPlugin, true);

  viewer.confirm = (NormalBufferPlugin) => true;
  window.confirm = (NormalBufferPlugin) => true;

  await viewer.addPlugin(SSBevelPlugin, true);

  const camViews = viewer.getPlugin(CameraViewPlugin);

  // This must be called after adding any plugin that changes the render pipeline.

  viewer.renderer.refreshPipeline();

  // Load a 3d model configured in the webgi editor using MaterialConfiguratorPlugin

  await manager.addFromPath("./assets/scene.glb");

  viewer.getPlugin(TonemapPlugin).contrast = 1.06;

  // viewer.getPlugin(TonemapPlugin)!.config!.clipBackground = true if we need clipped background

  viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });

  // --------------------------------- ON UPDATE

  let needsUpdate = true;

  function onUpdate() {
    needsUpdate = true;
  }

  // ---------------------------------  WEBGi loader ---------------------------------  //

  const importer = manager.importer;

  importer.addEventListener("onStart", (ev) => {
    //   onUpdate()
  });
  let loaderFix = document.querySelector(".loader");

  importer.addEventListener("onProgress", (ev) => {
    const progressRatio = ev.loaded / ev.total;
    document.querySelector(".progress").setAttribute("style", `transform: scaleX(${progressRatio})`);
  });

  importer.addEventListener("onLoad", (ev) => {
    if (firstLooad) {
      setupScrollAnimation();
    } else {
      loaderFix.style.opacity = "0";
      gsap.to(".loader", {
        x: "100%",
        duration: 0.1,
        ease: "power4.inOut",
        delay: 1,
      });
    }
  });

  viewer.renderer.refreshPipeline();

  await timeout(350);
  let diamondColorsContainer = document.querySelector(".footer-container-diamond-color");
  let ringColorsContainer = document.querySelector(".footer-container-ring-colors");
  const diamondColorsContainers = document.querySelector(".footer-container-ring-colors");

  // ---------------- ------------------------ SETUP SCROLL ANIMATION ---------------- ------------------------ //

  const setupScrollAnimation = () => {
    document.body.style.overflowY = "scroll";

    loaderFix.style.opacity = "0";
    loaderFix.style.visibility = "hidden";

    // ---------------------------------  TIMELINE

    const tl = gsap
      .timeline({ default: { ease: "none" } })
      .fromTo(
        ".section-1-container",
        {
          opacity: 0,
          x: "100%",
        },
        {
          opacity: 1,
          x: "0%",
          ease: "power4.inOut",
          duration: 1.8,
        },
        "-=1"
      )
      .to(".section-1-container", {
        opacity: 0,
        xPercent: "100",
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".section-2-container",
          start: "top bottom",
          end: "top top",
          scrub: 1,
          immediateRender: false,
        },
      })

      .fromTo(
        ".section-2-container",
        {
          opacity: 0,
          x: "-110%",
        },
        {
          opacity: 1,
          x: "0%",
          ease: "power4.inOut",
          scrollTrigger: {
            trigger: ".section-2-container",
            start: "top bottom",
            end: "top top",
            scrub: 1,
            immediateRender: false,
          },
        }
      )

      // ---------------------------------  EXIT SECTION 2

      .to(".section-2-container", {
        opacity: 0,
        x: "-110%",
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: ".three",
          start: "top bottom",
          end: "top top",
          scrub: 1,
          immediateRender: false,
        },
      })

      // ---------------------------------  ENTER SECTION 3

      .fromTo(
        ".section-3-content",
        {
          opacity: 0,
          y: "130%",
        },
        {
          opacity: 1,
          y: "0%",
          duration: 0.5,
          ease: "power4.inOut",
          scrollTrigger: {
            trigger: ".three",
            start: "top bottom",
            end: "top top",
            scrub: 1,
            immediateRender: false,
          },
        }
      );

    // ---------------------------------  EXIT SECTION 3

    // WEBGI UPDATE
    let needsUpdate = true;

    function onUpdate() {
      needsUpdate = true;
      viewer.renderer.resetShadows();
    }

    viewer.addEventListener("preFrame", () => {
      if (needsUpdate) {
        camera.positionTargetUpdated(true);
        needsUpdate = false;
      }
    });

    // --------------------------------- KNOW MORE ANIMATION BUTTON

    document.querySelector(".button-scroll").addEventListener("click", () => {
      const element = document.querySelector(".section-2-container");
      window.scrollTo({ top: element?.getBoundingClientRect().top, left: 0, behavior: "smooth" });
    });

    // ---------------------------------  ENTER CUSTOMIZE BUTTON

    const sections = document.querySelector(".container-hide");
    document.querySelector(".btn-customize").addEventListener("click", () => {
      bodyDocument.style.overflowY = "hidden";
      htmlDocument.style.overflowY = "hidden";
      canvasContainer.style.cursor = "grab";
      canvasContainer.style.zIndex = "1";
      document.body.style.cursor = "grab";
      // nightModeButton.style.opacity = "0"
      // musicButton.style.opacity = "0"
      scroller.enabled = false;
      camViews.animateToView(camViews.camViews[3]);
      EnablePointerEvents();
      enableControllers();
    });

    function EnablePointerEvents() {
      buttonExit.style.pointerEvents = "all";
      canvasView.style.pointerEvents = "all";
      canvasContainer.style.pointerEvents = "all";
      // musicButton.style.pointerEvents = "none"
      diamondColors.style.pointerEvents = "all";
      ringColors.style.pointerEvents = "all";
      // nightModeButton.style.pointerEvents = "none"
    }

    function enableControllers() {
      buttonExit.classList.add("visible");
      CustomizerInterface.classList.remove("hidden");
      CustomizerInterface.classList.add("visible");
      viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: true });
      cameraControls();
    }

    function cameraControls() {
      const options = viewer.scene.activeCamera.getCameraOptions();
      viewer.scene.activeCamera.setCameraOptions(options);
      const controls = viewer.scene.activeCamera.controls;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.minDistance = 3;
      controls.maxDistance = 15;
      camera.setCameraOptions({ controlsEnabled: true });
    }

    // ----------------------------   CUSTOMIZE EXIT

    buttonExit.addEventListener("click", () => {
      buttonExit.classList.remove("visible");
      CustomizerInterface.classList.remove("visible");
      CustomizerInterface.classList.add("hidden");
      diamondColorsContainer.classList.remove("visible");
      diamondColorsContainers.classList.remove("visible");
      // nightModeButton.style.opacity = "1"
      // musicButton.style.opacity = "1"
      disablePointerEvents();
      buttonExitFunc();
    });

    function disablePointerEvents() {
      diamondColors.style.pointerEvents = "none";
      ringColors.style.pointerEvents = "none";
      buttonExit.style.pointerEvents = "none";
      canvasContainer.style.pointerEvents = "none";

      // musicButton.style.pointerEvents = "all"
      // nightModeButton.style.pointerEvents = "all"
    }

    function buttonExitFunc() {
      scroller.enabled = true;

      bodyDocument.style.overflowY = "visible";
      htmlDocument.style.overflowY = "visible";
      sections.style.visibility = "visible";
      canvasView.style.pointerEvents = "all";
      canvasContainer.style.zIndex = "unset";
      document.body.style.cursor = "default";
      ringColorsContainer.style.opacity = "0";
      ringColorsContainer.style.visibility = "hidden";
      diamondColorsContainer.style.opacity = "0";
      diamondColorsContainer.style.visibility = "hidden";
    }

    function isCameraSetToFalse() {
      const options = viewer.scene.activeCamera.getCameraOptions();
      viewer.scene.activeCamera.setCameraOptions(options);
      const controls = viewer.scene.activeCamera.controls;
      controls.autoRotate = false;
      controls.maxDistance = Infinity;
    }

    function isAutoRotateFalse() {
      const options = viewer.scene.activeCamera.getCameraOptions();
      viewer.scene.activeCamera.setCameraOptions(options);
      const controls = viewer.scene.activeCamera.controls;
      controls.autoRotate = false;
    }

    function isAutoRotateTrue() {
      const controls = viewer.scene.activeCamera.controls;
      controls.autoRotate = true;
    }

    // ---------------------- CUSTOMIZE THE RING COLORS / PROPERTIES

    ringColors.addEventListener("click", () => {
      hideDiamondColorsContainer();
      isAutoRotateFalse();
      diamondColorsContainers.style.visibility = "visible";
      diamondColorsContainers.style.pointerEvents = "all";
      diamondColorsContainers.style.opacity = "1";
      setTimeout(() => {
        movetoRing();
      }, 500);
    });

    diamondColors.addEventListener("click", () => {
      hideRingColorsContainer();
      isAutoRotateFalse();
      diamondColorsContainer.style.visibility = "visible";
      diamondColorsContainer.style.pointerEvents = "all";
      diamondColorsContainer.style.opacity = "1";
      setTimeout(() => {
        movetoDiamonds();
      }, 500);
    });

    function hideRingColorsContainer() {
      ringColorsContainer.style.opacity = "0";
      ringColorsContainer.style.visibility = "hidden";
      ringColorsContainer.style.pointerEvents = "none";
    }

    function hideDiamondColorsContainer() {
      diamondColorsContainer.style.opacity = "0";
      diamondColorsContainer.style.visibility = "hidden";
      diamondColorsContainer.style.pointerEvents = "none";
    }

    function closegems() {
      diamondColorsContainer.style.opacity = 0;
      diamondColorsContainer.style.visibility = "hidden";
      diamondColorsContainer.style.pointerEvents = "none";
    }

    function closeMaterialTab() {
      ringColorsContainer.style.opacity = 0;
      ringColorsContainer.style.visibility = "hidden";
      ringColorsContainer.pointerEvents = "none";
    }

    async function movetoRing() {
      let moveRing = camViews.getCurrentCameraView(viewer.scene.activeCamera);
      moveRing.position.set(-2.25, -0.18, 4.56);
      if (isMobile === true) {
        moveRing.position.set(-5, 0.38, 8);
      }
      moveRing.target.set(0.2, 0.28, -0.02);
      await camViews.animateToView(moveRing, 1000, EasingFunctions.easeInOut);
    }
    async function movetoDiamonds() {
      let moveDiamonds = camViews.getCurrentCameraView(viewer.scene.activeCamera);
      moveDiamonds.position.set(1.59, 0.65, 5.05);
      if (isMobile === true) {
        moveDiamonds.position.set(1.8, 1.2, 8.4);
      }
      moveDiamonds.target.set(-0.1, 0.02, 0.4);
      await camViews.animateToView(moveDiamonds, 1000, EasingFunctions.easeInOut);
    }

    // close gems and ring

    const closeButtonMetal = document.getElementById("Metal1");
    closeButtonMetal.addEventListener("click", () => {
      closegems();
      closeMaterialTab();
      isAutoRotateTrue();
    });
    const closeButtonGem = document.getElementById("Gem1");
    closeButtonGem.addEventListener("click", () => {
      closegems();
      closeMaterialTab();
      isAutoRotateTrue();
    });
  };
  setupScrollAnimation();
}

setupViewer();
