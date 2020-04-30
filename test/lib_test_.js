const { sleep, printLogInOneLine, readFileByLine } = require('../libs/index')

function test_printLogInOneLine() {
  for (let i = 0; i < 100; i ++) {
    printLogInOneLine(`now is ${i}`)
    sleep(1)
  }
}

function test_readFileByLine() {
  readFileByLine(null, line => {
    printLogInOneLine(`line: ${line}`)
    sleep(1)
  })
}
test_readFileByLine();
