import { BasePage, BasePageBClient, EmptyPage, Material } from "@chamn/demo-page";
import { Button, message, Modal } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import ReactDOMClient from "react-dom/client";
import "@chamn/engine/dist/style.css";
import {
  Engine,
  EnginContext,
  InnerComponentMeta,
  collectVariable,
  flatObject,
  LayoutPropsType,
  plugins
} from "@chamn/engine";
import { AssetPackage } from "@chamn/model";
import { RollbackOutlined } from "@ant-design/icons";
import { DesignerPluginInstance } from "@chamn/engine/dist/plugins/Designer/type";

const { DisplaySourceSchema, DEFAULT_PLUGIN_LIST } = plugins;

const beforeInitRender: LayoutPropsType["beforeInitRender"] = async ({ iframe }) => {
  const subWin = iframe.getWindow();
  if (!subWin) {
    return;
  }
  (subWin as any).React = React;
  (subWin as any).ReactDOM = ReactDOM;
  (subWin as any).ReactDOMClient = ReactDOMClient;
};

const customRender: LayoutPropsType["customRender"] = async ({
  iframe: iframeContainer,
  assets,
  page,
  pageModel,
  ready
}) => {
  await iframeContainer.injectJS("./render.umd.js");
  const iframeWindow = iframeContainer.getWindow()!;
  const iframeDoc = iframeContainer.getDocument()!;
  const IframeReact = iframeWindow.React!;
  const IframeReactDOM = iframeWindow.ReactDOMClient!;
  const CRender = iframeWindow.CRender!;

  // 注入组件物料资源
  const assetLoader = new CRender.AssetLoader(assets, {
    window: iframeContainer.getWindow()!
  });
  assetLoader
    .onSuccess(() => {
      // 从子窗口获取物料对象
      const componentCollection = collectVariable(assets, iframeWindow);
      const components = flatObject(componentCollection);

      const App = IframeReact?.createElement(CRender.DesignRender, {
        adapter: CRender?.ReactAdapter,
        page: page,
        pageModel: pageModel,
        components,
        onMount: (designRenderInstance) => {
          ready(designRenderInstance);
        }
      });

      IframeReactDOM.createRoot(iframeDoc.getElementById("app")!).render(App);
    })
    .onError(() => {
      console.log("资源加载出粗");
    })
    .load();
};

const assets: AssetPackage[] = [
  {
    package: "antd",
    globalName: "antd",
    resources: [
      {
        src: "https://cdn.bootcdn.net/ajax/libs/antd/5.1.2/reset.css"
      },
      {
        src: "https://cdn.bootcdn.net/ajax/libs/dayjs/1.11.7/dayjs.min.js"
      },
      {
        src: "https://cdn.bootcdn.net/ajax/libs/antd/5.1.2/antd.js"
      }
    ]
  }
];

const assetPackagesList = [
  {
    package: "@chamn/mock-material",
    globalName: "antd",
    resources: [
      {
        src: "https://cdn.bootcdn.net/ajax/libs/antd/5.1.2/reset.css"
      },
      {
        src: "https://cdn.bootcdn.net/ajax/libs/dayjs/1.11.7/dayjs.min.js"
      },
      {
        src: "https://cdn.bootcdn.net/ajax/libs/antd/5.1.2/antd.js"
      }
    ]
  }
];

export const App = () => {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(BasePage);

  useEffect(() => {
    const localPage = localStorage.getItem("pageSchema");
    if (localPage) {
      setPage(JSON.parse(localPage));
    }
    setReady(true);
  }, []);
  const onReady = useCallback(async (ctx: EnginContext) => {
    const designer = await ctx.pluginManager.get<DesignerPluginInstance>("Designer");
    const reloadPage = async () => {
      setTimeout(() => {
        const designerExport = designer?.export;
        console.log("to reload");
        designerExport?.reload({
          assets
        });
      }, 0);
    };

    reloadPage();

    const workbench = ctx.engine.getWorkbench();

    workbench?.replaceTopBarView(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: "10px"
        }}
      >
        <a target="_blank" href="https://github.com/hlerenow/chameleon" rel="noreferrer">
          <Button style={{ marginRight: "10px" }}>Github </Button>
        </a>

        <Button
          style={{ marginRight: "10px" }}
          onClick={async () => {
            const res = await ctx.pluginManager.get("History");
            res?.exports.preStep();
          }}
        >
          <RollbackOutlined />
        </Button>
        <Button
          style={{ marginRight: "10px" }}
          onClick={async () => {
            const res = await ctx.pluginManager.get("History");
            res?.exports.nextStep();
          }}
        >
          <RollbackOutlined
            style={{
              transform: "rotateY(180deg)"
            }}
          />
        </Button>

        <DisplaySourceSchema pageModel={ctx.engine.pageModel} engineCtx={ctx}>
          <Button style={{ marginRight: "10px" }}>Source Code</Button>
        </DisplaySourceSchema>

        <Button
          style={{ marginRight: "10px" }}
          onClick={() => {
            reloadPage();
          }}
        >
          Refresh Page
        </Button>
        <Button
          style={{ marginRight: "10px" }}
          onClick={() => {
            let src = "/#/preview";
            if (location.href.includes("hlerenow")) {
              src = "/chameleon/#/preview";
            }

            Modal.info({
              closable: true,
              icon: null,
              width: "calc(100vw - 100px)",
              centered: true,
              title: (
                <div>
                  Preview
                  <Button
                    size="small"
                    style={{
                      float: "right",
                      marginRight: "30px"
                    }}
                    onClick={() => {
                      window.open(src);
                    }}
                  >
                    Open in new window
                  </Button>
                </div>
              ),
              content: (
                <div
                  style={{
                    width: "100%",
                    height: "calc(100vh - 200px)"
                  }}
                >
                  <iframe
                    style={{
                      border: "1px solid #e7e7e7",
                      width: "100%",
                      height: "100%",
                      borderRadius: "4px",
                      overflow: "hidden"
                    }}
                    src={src}
                  />
                </div>
              ),
              footer: null
            });
          }}
        >
          Preview
        </Button>
        <Button
          type="primary"
          onClick={() => {
            const newPage = ctx.engine.pageModel.export();
            localStorage.setItem("pageSchema", JSON.stringify(newPage));
            message.success("Save successfully");
          }}
        >
          Save
        </Button>
      </div>
    );
  }, []);

  if (!ready) {
    return <>loading...</>;
  }
  return (
    <Engine
      plugins={DEFAULT_PLUGIN_LIST}
      schema={page as any}
      material={[...InnerComponentMeta, ...Material]}
      assets={[]}
      assetPackagesList={assetPackagesList}
      onReady={onReady}
      beforePluginRun={({ pluginManager }) => {
        pluginManager.customPlugin("Designer", (pluginInstance) => {
          pluginInstance.ctx.config.beforeInitRender = beforeInitRender;
          pluginInstance.ctx.config.customRender = customRender;
          return pluginInstance;
        });
      }}
    />
  );
};
