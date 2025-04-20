// components/DatePicker.js
import React, { useState } from "react";
import { View, Button, Text } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function DatePicker({ onConfirm }) {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    setSelectedDate(date);
    hideDatePicker();
    if (onConfirm) onConfirm(date);
  };

  return (
    <View>
      <Button title="Pick a Date" onPress={showDatePicker} />
      {selectedDate && <Text>Selected: {selectedDate.toLocaleString()}</Text>}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </View>
  );
}
