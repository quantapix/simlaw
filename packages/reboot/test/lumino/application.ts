import { Application } from "../../src/lumino/application.js"
import { ContextMenu, Widget } from "../../src/lumino/widgets.js"
import { CommandRegistry } from "../../src/lumino/commands.js"
import { Token } from "../../src/lumino/utils.js"
describe("Application", () => {
  describe("Application", () => {
    describe("#constructor", () => {
      it("should instantiate an application", () => {
        const shell = new Widget()
        const app = new Application({
          shell,
        })
        expect(app).to.be.instanceOf(Application)
        expect(app.commands).to.be.instanceOf(CommandRegistry)
        expect(app.contextMenu).to.be.instanceOf(ContextMenu)
        expect(app.shell).to.equal(shell)
      })
    })
    describe("#hasPlugin", () => {
      it("should be true for registered plugin", () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        expect(app.hasPlugin(id)).to.be.true
      })
      it("should be false for unregistered plugin", () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        expect(app.hasPlugin("plugin2")).to.be.false
      })
    })
    describe("#isPluginActivated", () => {
      it("should be true for activated plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        await app.activatePlugin(id)
        expect(app.isPluginActivated(id)).to.be.true
      })
      it("should be true for an autoStart plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
          autoStart: true,
        })
        await app.start()
        expect(app.isPluginActivated(id)).to.be.true
      })
      it("should be false for not activated plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        expect(app.isPluginActivated(id)).to.be.false
      })
      it("should be false for unregistered plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        await app.activatePlugin(id)
        expect(app.isPluginActivated("no-registered")).to.be.false
      })
    })
    describe("#listPlugins", () => {
      it("should list the registered plugin", () => {
        const app = new Application({ shell: new Widget() })
        const ids = ["plugin1", "plugin2"]
        ids.forEach(id => {
          app.registerPlugin({
            id,
            activate: () => {},
          })
        })
        expect(app.listPlugins()).to.deep.equal(ids)
      })
    })
    describe("#registerPlugin", () => {
      it("should register a plugin", () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        expect(app.hasPlugin(id)).to.be.true
      })
      it("should not register an already registered plugin", () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        expect(function () {
          app.registerPlugin({
            id,
            activate: () => {},
          })
        }).to.throw()
      })
      it("should not register a plugin introducing a cycle", () => {
        const app = new Application({ shell: new Widget() })
        const id1 = "plugin1"
        const token1 = new Token<any>(id1)
        const id2 = "plugin2"
        const token2 = new Token<any>(id2)
        const id3 = "plugin3"
        const token3 = new Token<any>(id3)
        app.registerPlugin({
          id: id1,
          activate: () => {},
          requires: [token3],
          provides: token1,
        })
        app.registerPlugin({
          id: id2,
          activate: () => {},
          requires: [token1],
          provides: token2,
        })
        expect(function () {
          app.registerPlugin({
            id: id3,
            activate: () => {},
            requires: [token2],
            provides: token3,
          })
        }).to.throw()
      })
    })
    describe("#deregisterPlugin", () => {
      it("should deregister a deactivated registered plugin", () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        app.deregisterPlugin(id)
        expect(app.hasPlugin(id)).to.be.false
      })
      it("should not deregister an activated registered plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        await app.activatePlugin(id)
        expect(() => {
          app.deregisterPlugin(id)
        }).to.throw()
        expect(app.hasPlugin(id)).to.be.true
      })
      it("should force deregister an activated registered plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        await app.activatePlugin(id)
        app.deregisterPlugin(id, true)
        expect(app.hasPlugin(id)).to.be.false
      })
    })
    describe("#activatePlugin", () => {
      it("should activate a registered plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        await app.activatePlugin(id)
        expect(app.isPluginActivated(id)).to.be.true
      })
      it("should throw an error when activating a unregistered plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        try {
          await app.activatePlugin("other-id")
        } catch (reason) {
          return
        }
        expect(false, "app.activatePlugin did not throw").to.be.true
      })
      it("should tolerate activating an activated plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        await app.activatePlugin(id)
        await app.activatePlugin(id)
        expect(app.isPluginActivated(id)).to.be.true
      })
      it("should activate all required services", async () => {
        const app = new Application({ shell: new Widget() })
        const id1 = "plugin1"
        const token1 = new Token<any>(id1)
        const id2 = "plugin2"
        const token2 = new Token<any>(id2)
        const id3 = "plugin3"
        const token3 = new Token<any>(id3)
        app.registerPlugin({
          id: id1,
          activate: () => {},
          provides: token1,
        })
        app.registerPlugin({
          id: id2,
          activate: () => {},
          requires: [token1],
          provides: token2,
        })
        app.registerPlugin({
          id: id3,
          activate: () => {},
          requires: [token2],
          provides: token3,
        })
        await app.activatePlugin(id3)
        expect(app.isPluginActivated(id3)).to.be.true
        expect(app.isPluginActivated(id1)).to.be.true
        expect(app.isPluginActivated(id2)).to.be.true
      })
      it("should try activating all optional services", async () => {
        const app = new Application({ shell: new Widget() })
        const id1 = "plugin1"
        const token1 = new Token<any>(id1)
        const id2 = "plugin2"
        const token2 = new Token<any>(id2)
        const id3 = "plugin3"
        const token3 = new Token<any>(id3)
        app.registerPlugin({
          id: id1,
          activate: () => {},
          provides: token1,
        })
        app.registerPlugin({
          id: id2,
          activate: () => {
            throw new Error(`Force failure during '${id2}' activation`)
          },
          provides: token2,
        })
        app.registerPlugin({
          id: id3,
          activate: () => {},
          optional: [token1, token2],
          provides: token3,
        })
        await app.activatePlugin(id3)
        expect(app.isPluginActivated(id3)).to.be.true
        expect(app.isPluginActivated(id1)).to.be.true
        expect(app.isPluginActivated(id2)).to.be.false
      })
    })
    describe("#deactivatePlugin", () => {
      it("should call deactivate on the plugin", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        let deactivated: boolean | null = null
        app.registerPlugin({
          id,
          activate: () => {
            deactivated = false
          },
          deactivate: () => {
            deactivated = true
          },
        })
        await app.activatePlugin(id)
        expect(deactivated).to.be.false
        const others = await app.deactivatePlugin(id)
        expect(deactivated).to.be.true
        expect(others.length).to.equal(0)
      })
      it("should throw an error if the plugin does not support deactivation", async () => {
        const app = new Application({ shell: new Widget() })
        const id = "plugin1"
        app.registerPlugin({
          id,
          activate: () => {},
        })
        await app.activatePlugin(id)
        try {
          await app.deactivatePlugin(id)
        } catch (r) {
          return
        }
        expect(true, "app.deactivatePlugin did not throw").to.be.false
      })
      it("should throw an error if the plugin has dependants not support deactivation", async () => {
        const app = new Application({ shell: new Widget() })
        const id1 = "plugin1"
        const token1 = new Token<any>(id1)
        const id2 = "plugin2"
        const token2 = new Token<any>(id2)
        const id3 = "plugin3"
        const token3 = new Token<any>(id3)
        app.registerPlugin({
          id: id1,
          activate: () => {},
          deactivate: () => {},
          provides: token1,
        })
        app.registerPlugin({
          id: id2,
          activate: () => {},
          deactivate: () => {},
          requires: [token1],
          provides: token2,
        })
        app.registerPlugin({
          id: id3,
          activate: () => {},
          requires: [token2],
          provides: token3,
        })
        await app.activatePlugin(id3)
        try {
          await app.deactivatePlugin(id1)
        } catch (r) {
          return
        }
        expect(true, "app.deactivatePlugin did not throw").to.be.false
      })
      it("should deactivate all dependents (optional or not)", async () => {
        const app = new Application({ shell: new Widget() })
        let deactivated: boolean | null = null
        const id1 = "plugin1"
        const token1 = new Token<any>(id1)
        const id2 = "plugin2"
        const token2 = new Token<any>(id2)
        const id3 = "plugin3"
        const token3 = new Token<any>(id3)
        app.registerPlugin({
          id: id1,
          activate: () => {
            deactivated = false
          },
          deactivate: () => {
            deactivated = true
          },
          provides: token1,
        })
        app.registerPlugin({
          id: id2,
          activate: () => {},
          deactivate: () => {},
          requires: [token1],
          provides: token2,
        })
        app.registerPlugin({
          id: id3,
          activate: () => {},
          deactivate: () => {},
          optional: [token2],
          provides: token3,
        })
        await app.activatePlugin(id3)
        const others = await app.deactivatePlugin(id1)
        expect(deactivated).to.be.true
        expect(others).to.deep.equal([id3, id2])
        expect(app.isPluginActivated(id2)).to.be.false
        expect(app.isPluginActivated(id3)).to.be.false
      })
    })
  })
})
