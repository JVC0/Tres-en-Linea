import React, { useState } from "react";
import { View } from "react-native";
import Box from "./Box";
const Board = () => {
	const [playerTurn, setPlayerTurn] = useState(null);
	const [squares, setSquares] = useState(Array(9).fill(null));
	function handleBoxPress(boxIndex: number) {
		setPlayerTurn(playerTurn)
	}

	return (
		<View>
			<div className="board-row">	
				<Box Value={squares[0]} />
				<Box Value={squares[1]} />
				<Box Value={squares[2]} />
			</div>
			<div className="board-row">
				<Box Value={squares[3]} />
				<Box Value={squares[4]} />
				<Box Value={squares[5]} />
			</div>
			<div className="board-row">
				<Box Value={squares[6]} />
				<Box Value={squares[7]} />
				<Box Value={squares[8]} />
			</div>
		</View>
	);
};
export default Board;

