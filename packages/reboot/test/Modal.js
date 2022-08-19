import ReactDOMServer from "react-dom/server"
import Modal from "../../src/Modal"

describe("Modal", () => {
  test("Should be rendered on the server side", () => {
    let noOp = () => {}

    assert.doesNotThrow(() =>
      ReactDOMServer.renderToString(
        <Modal onHide={noOp}>
          <strong>Message</strong>
        </Modal>
      )
    )
  })
})