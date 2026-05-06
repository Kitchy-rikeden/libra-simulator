import { useState } from 'react'
import { useSearchParams } from "react-router-dom";
import { Core, stepInfo } from '@core/simulator'
import { BalancedTernary as BT } from '@core/balanced_ternary';
import { assemble } from '@core/assembler';
import styles from './styles';
import sample_abcde from "@samples/abcde.s?raw";
import sample_tribonacci from "@samples/tribonacci.s?raw";

function App() {
  // クエリパラメータでサンプル使用
  const [searchParams] = useSearchParams();
  const sample = searchParams.get("sample");
  let initial_program = "";
  if (sample === "abcde") {
    initial_program = sample_abcde;
  }
  else if (sample == "tribonacci") {
    initial_program = sample_tribonacci;
  }

  const [core, setCore] = useState(new Core("", (_) => { }, () => 0));
  const [program, setProgram] = useState(initial_program);
  const [isAssembly, setIsAssembly] = useState(true);
  const [steps, setSteps] = useState<number | string>(100);
  const [output, setOutput] = useState<number[]>([]);
  const [log, setLog] = useState<stepInfo[]>([]);
  const [message, setMessage] = useState("");
  const [ternaryChecked, setTernaryChecked] = useState(false);


  // 実行ステップ数入力フィールドの変更処理
  const handleStepsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const s = event.target.value;
    const value = parseInt(s, 10);
    if (isNaN(value)) {
      setSteps(s)
    } else {
      setSteps(value);
    }
  };

  // リセットボタンの処理
  const handleReset = () => {
    try {
      const machineCode = isAssembly ? assemble(program).join("\n") : program;
      const core = new Core(machineCode, (v) => setOutput((old) => [...old, v]), () => 0);
      setCore(core);
      setOutput([]);
      setLog([]);
      setMessage("Program loaded");
    } catch (e) {
      if (e instanceof Error) {
        setMessage(e.message);
      }
      else {
        console.log(e);
      }
    }
  };

  // 実行ボタンの処理
  const handleRun = () => {
    try {
      if (typeof (steps) === "string") {
        setMessage("ステップ数が無効です");
      }
      else if (program.length === 0) {
        setMessage("プログラムが空です");
      }
      else {
        setMessage("");
        for (let i = 0; i < steps; i++) {
          const log = core.step();
          setLog((old) => [...old, log]);
          if (log.opname === "HALT") {
            setMessage("Successfully Halted!");
            return;
          }
        }
      }
    }
    catch (e) {
      if (e instanceof Error) {
        setMessage(e.message);
      }
      else {
        console.log(e);
      }
    }
  };

  return (
    <div className="App">
      <div style={{ display: "flex" }}>
        <div style={styles.borderBox}>
          <div>
            <label>
              プログラム:
              <textarea
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                rows={10}
                cols={10}
                placeholder="ここに入力してください（改行可能）"
              ></textarea>
            </label>
          </div>

          <div>
            <label>
              <input type="radio" checked={isAssembly} onChange={() => setIsAssembly(true)} />
              アセンブリ
            </label>
            <label>
              <input type="radio" checked={!isAssembly} onChange={() => setIsAssembly(false)} />
              機械語
            </label>
          </div>

          <button
            style={styles.button}
            onClick={handleReset}>
            プログラムロード & 表示リセット
          </button>

          <div>
            <label>
              実行ステップ数:
              <input
                type="number"
                value={steps}
                onChange={handleStepsChange}
                placeholder="実行ステップ数"
                width={100}
              />
            </label>
          </div>

          <button
            style={styles.button}
            onClick={handleRun}>
            実行
          </button>
        </div>

        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={styles.borderBox}>
            <strong>出力結果</strong>
            <div style={{
              maxHeight: 300,
              overflow: "scroll",
            }}>
              <table style={styles.table}>
                <colgroup>
                  <col style={{ width: "auto" }} />
                  <col style={{ width: "80px" }} />
                  <col style={{ width: "80px" }} />
                  <col style={{ width: "80px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th></th>
                    <th>Dec</th>
                    <th>Ter</th>
                    <th>ASCII</th>
                  </tr>
                </thead>
                <tbody>
                  {output.map((v, i) => {
                    return (<tr key={i}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>{v}</td>
                      <td style={styles.td}>{BT.intToStr(v).padStart(5, "0")}</td>
                      <td style={styles.td}>{BT.intToAscii(v)}</td>
                    </tr>)
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={styles.borderBox}>
            <strong>メッセージ</strong>
            <p style={styles.p}>{message === "" ? "No message" : message}</p>
          </div>
        </div>


      </div>

      <div>
        <div style={{
          display: "flex",
          gap: "20px",
        }}>
          <strong>ログ</strong>
          <label>
            <input
              type="checkbox"
              name="ternaryCheckbox"
              checked={ternaryChecked}
              onChange={(e) => setTernaryChecked(e.target.checked)}
            />
            Ternary
          </label>
        </div>

        <table style={styles.table}>
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "70px" }} />
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th>命令</th>
              <th>動作</th>
              <th>PC</th>
              <th>SP</th>
              <th>sign</th>
              <th>A</th>
              <th>B</th>
              <th>C</th>
            </tr>
          </thead>
          <tbody>
            {log.map((info, i) => {
              return (<tr key={i}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>{info.opname}</td>
                <td style={{ ...styles.td, textAlign: "left" }}>{info.description}</td>
                <td style={styles.td}>{ternaryChecked ? BT.intToStr(info.snap.pc).padStart(5, "0") : info.snap.pc}</td>
                <td style={styles.td}>{ternaryChecked ? BT.intToStr(info.snap.sp).padStart(5, "0") : info.snap.sp}</td>
                <td style={styles.td}>{info.snap.sign}</td>
                <td style={styles.td}>{ternaryChecked ? BT.intToStr(info.snap.a).padStart(5, "0") : info.snap.a}</td>
                <td style={styles.td}>{ternaryChecked ? BT.intToStr(info.snap.b).padStart(5, "0") : info.snap.b}</td>
                <td style={styles.td}>{ternaryChecked ? BT.intToStr(info.snap.c).padStart(5, "0") : info.snap.c}</td>
              </tr>)
            })}
          </tbody>
        </table>
      </div >
    </div>
  );
}

export default App
