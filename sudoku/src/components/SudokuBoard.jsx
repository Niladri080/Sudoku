import React, { useState, useEffect, useRef } from "react";

const copyBoard = (board) => board.map((row) => [...row]);

function generateFullBoard() {
  const board = Array(9)
    .fill()
    .map(() => Array(9).fill(""));
  fillBoard(board);
  return board;
}

function fillBoard(board) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === "") {
        const shuffled = nums.sort(() => Math.random() - 0.5);
        for (let num of shuffled) {
          if (isValid(board, row, col, num.toString())) {
            board[row][col] = num.toString();
            if (fillBoard(board)) return true;
            board[row][col] = "";
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzleBoard(difficulty) {
  const full = generateFullBoard();
  let attempts = 0;
  let removals;
  if (difficulty === "Easy") removals = 36;
  else if (difficulty === "Medium") removals = 46;
  else removals = 54;
  const puzzle = copyBoard(full);
  while (removals > 0 && attempts < 1000) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== "") {
      const backup = puzzle[row][col];
      puzzle[row][col] = "";
      removals--;
    }
    attempts++;
  }
  return puzzle;
}

const initialBoard = Array(9)
  .fill()
  .map(() => Array(9).fill(""));

const isValid = (board, row, col, num) => {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (board[boxRow][boxCol] === num) return false;
  }
  return true;
};

const solveSudoku = (board) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === "") {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num.toString())) {
            board[row][col] = num.toString();
            if (solveSudoku(board)) return true;
            board[row][col] = "";
          }
        }
        return false;
      }
    }
  }
  return true;
};

export default function SudokuBoard() {
  const [board, setBoard] = useState(initialBoard);
  const [puzzle, setPuzzle] = useState(initialBoard);
  const [difficulty, setDifficulty] = useState("Easy");
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleGenerate = () => {
    const newPuzzle = generatePuzzleBoard(difficulty);
    setPuzzle(newPuzzle);
    setBoard(copyBoard(newPuzzle));
    setTimer(0);
    setRunning(true);
    setMessage("");
    setMessageType("");
  };

  const handleChange = (e, row, col) => {
    const value = e.target.value;
    if (value === "" || /^[1-9]$/.test(value)) {
      const newBoard = [...board].map((r) => [...r]);
      newBoard[row][col] = value;
      setBoard(newBoard);
    }
  };

  const checkSolution = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (!board[row][col]) {
          setMessage("The board is not completely filled.");
          setMessageType("error");
          return;
        }
      }
    }
    for (let i = 0; i < 9; i++) {
      const rowSet = new Set();
      const colSet = new Set();
      const boxSet = new Set();
      for (let j = 0; j < 9; j++) {
        if (rowSet.has(board[i][j])) {
          setMessage("Incorrect solution: duplicate in a row.");
          setMessageType("error");
          return;
        }
        rowSet.add(board[i][j]);
        if (colSet.has(board[j][i])) {
          setMessage("Incorrect solution: duplicate in a column.");
          setMessageType("error");
          return;
        }
        colSet.add(board[j][i]);
        // Box
        const boxRow = 3 * Math.floor(i / 3) + Math.floor(j / 3);
        const boxCol = 3 * Math.floor(col / 3) + (j % 3);
        if (boxSet.has(board[boxRow][boxCol])) {
          setMessage("Incorrect solution: duplicate in a 3x3 box.");
          setMessageType("error");
          return;
        }
        boxSet.add(board[boxRow][boxCol]);
      }
    }
    setMessage("Congratulations! The solution is correct.");
    setMessageType("success");
  };

  const handleSolve = () => {
    const copiedBoard = board.map((row) => [...row]);
    if (solveSudoku(copiedBoard)) {
      setBoard(copiedBoard);
      setRunning(false);
      // Do not clear the message here
    } else {
      setMessage("No solution exists");
      setMessageType("error");
    }
  };

  const handleClear = () => {
    setBoard(copyBoard(puzzle));
    setTimer(0);
    setRunning(false);
    setMessage("");
    setMessageType("");
  };

  const handleDifficulty = (e) => {
    setDifficulty(e.target.value);
  };

  const getConflicts = (row, col, value) => {
    if (!value) return [];
    const conflicts = [];
    for (let i = 0; i < 9; i++) {
      if (i !== col && board[row][i] === value) conflicts.push([row, i]);
      if (i !== row && board[i][col] === value) conflicts.push([i, col]);
    }
    const boxRow = 3 * Math.floor(row / 3);
    const boxCol = 3 * Math.floor(col / 3);
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c] === value)
          conflicts.push([r, c]);
      }
    }
    return conflicts;
  };
  const isInSameGroup = (row, col, selRow, selCol) => {
    if (row === selRow || col === selCol) return true;
    return (
      Math.floor(row / 3) === Math.floor(selRow / 3) &&
      Math.floor(col / 3) === Math.floor(selCol / 3)
    );
  };

  return (
    <div className="sudoku-container">
      <h2 className="title">Sudoku Solver</h2>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div className="row" key={rowIndex}>
            {row.map((cell, colIndex) => {
              let highlight = "";
              if (selectedCell) {
                const [selRow, selCol] = selectedCell;
                const selectedValue = board[selRow][selCol];
                if (
                  selectedValue &&
                  cell === selectedValue &&
                  !(rowIndex === selRow && colIndex === selCol)
                ) {
                  highlight = "same-number";
                }
                if (
                  (rowIndex === selRow && colIndex !== selCol) ||
                  (colIndex === selCol && rowIndex !== selRow) ||
                  (Math.floor(rowIndex / 3) === Math.floor(selRow / 3) &&
                    Math.floor(colIndex / 3) === Math.floor(selCol / 3) &&
                    !(rowIndex === selRow && colIndex === selCol))
                ) {
                  if (
                    cell &&
                    cell === board[selRow][selCol] &&
                    !(rowIndex === selRow && colIndex === selCol)
                  ) {
                    highlight = "conflict";
                  }
                }
              }
              return (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  className={`cell${
                    highlight ? " highlight-" + highlight : ""
                  }`}
                  type="text"
                  maxLength="1"
                  value={cell}
                  onChange={(e) => handleChange(e, rowIndex, colIndex)}
                  onFocus={() => setSelectedCell([rowIndex, colIndex])}
                  onBlur={() => setSelectedCell(null)}
                  disabled={puzzle[rowIndex][colIndex] !== ""}
                  style={{
                    ...(puzzle[rowIndex][colIndex] !== ""
                      ? {
                          background: "#1e2230",
                          color: "#00aaff",
                          fontWeight: 700,
                        }
                      : {}),
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="control-panel">
        <div>
          <label htmlFor="difficulty">Difficulty: </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={handleDifficulty}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div style={{ fontWeight: 600, fontSize: "1.1em" }}>
          ⏱ {formatTime(timer)}
        </div>
        <button onClick={handleGenerate}>New Puzzle</button>
        <button className="pause-btn" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Resume"}
        </button>
        <button onClick={handleSolve}>Solve</button>
        <button onClick={handleClear}>Clear</button>
        <button onClick={checkSolution}>Check Solution</button>
      </div>
      {message && (
        <div className={`message-area ${messageType}`}>{message}</div>
      )}
    </div>
  );
}
