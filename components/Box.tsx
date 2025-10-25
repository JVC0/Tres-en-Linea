import React from "react";
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity } from "react-native";

const Box = ({
	Value,
	onPress,
}: {
	Value: string;
	onPress: (event: GestureResponderEvent) => void;
}) => {
	return (
		<TouchableOpacity onPress={onPress}>
			<Text style={styles.text}>{Value}</Text>
		</TouchableOpacity>
	);
};
const styles = StyleSheet.create({
	square: {
		width: 60,
		height: 60,
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "black",
		margin: 1,
	},
	text: {
		fontSize: 24,
		fontWeight: "bold",
	},
});
export default Box;
