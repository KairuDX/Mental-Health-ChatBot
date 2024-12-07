import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Animated,
    Alert,
    Platform,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import axios from "axios";
import ChatBubble from "./ChatBubble";
import { speak, isSpeakingAsync, stop } from "expo-speech";
import { API_KEY } from "@env";

const Healio = () => {
    const [chat, setChat] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [recentChats, setRecentChats] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarWidth = useRef(new Animated.Value(0)).current;

    //System Prompt
    const predefinedContext = [
        {
            role: "user",
            parts: [
                {
                    text: "you are a mental health support chatbot. your sole purpose is to provide helpful advice, tips, and support related to mental health and emotional well-being. only respond with guidance on topics like stress management, anxiety relief, self-care routines, mindfulness, and coping strategies. avoid any unrelated topics, including programming, technology, and medical diagnoses. always keep your answers concise and focused on mental health. if a user asks about anything outside of these topics, politely remind them that you are dedicated to offering support in mental health and emotional care only. avoid being repetitive at chatting. try to not ask too many question. add some emojis at the end to ease user",
                },
            ],
        },
        {
            role: "model",
            parts: [
                {
                    text: "Understood. I am here to help with mental health and emotional well-being. How can I support you today?",
                },
            ],
        },
    ];

    const handleUserInput = async () => {
        let updatedChat = [
            ...predefinedContext,
            ...chat,
            {
                role: "user",
                parts: [{ text: userInput }],
            },
        ];
    
        setLoading(true);

        //API Implementation
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
                {
                    contents: updatedChat,
                }
            );
    
            const modelResponse =
                response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
            if (modelResponse) {
                const visibleChat = [
                    ...chat,
                    {
                        role: "user",
                        parts: [{ text: userInput }],
                    },
                    {
                        role: "model",
                        parts: [{ text: modelResponse }],
                    },
                ];
    
                setChat(visibleChat);
                setUserInput("");
                handleSpeech(modelResponse);

            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveChat = () => {
        const newChats = [chat, ...recentChats].slice(0, 5);
        setRecentChats(newChats);
        Alert.alert("Success", "Chat Saved", [{ text: "OK" }]);
    };

    const handleSpeech = async (text) => {
        // Remove emojis and asterisks from the text
        const textWithoutEmojisAndAsterisks = text.replace(
            /[\p{Emoji_Presentation}\p{Extended_Pictographic}*]/gu,
            ""
        );

        if (isSpeaking) {
            stop();
            setIsSpeaking(false);
        } else {
            if (!(await isSpeakingAsync())) {
                speak(textWithoutEmojisAndAsterisks, {
                    onDone: () => setIsSpeaking(false),
                    onStopped: () => setIsSpeaking(false),
                });
                setIsSpeaking(true);
            }
        }
    };
    
    const toggleSidebar = () => {
        const toValue = sidebarOpen ? 0 : 200;
        Animated.timing(sidebarWidth, {
            toValue,
            duration: 300,
            useNativeDriver: false,
        }).start();

        setSidebarOpen(!sidebarOpen);
    };

    const handleRemoveChat = (index) => {
        if (Platform.OS === 'web') {
            // Directly remove the chat when in web
            setRecentChats((prevChats) => prevChats.filter((_, i) => i !== index));
        } else {
            // Show alert for mobile platforms
            Alert.alert(
                'Confirm Removal',
                'Are you sure you want to remove this chat?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Remove', 
                        onPress: () => {
                            setRecentChats((prevChats) => prevChats.filter((_, i) => i !== index));
                        } 
                    },
                ],
                { cancelable: true }
            );
        }
    };
    

    const handleSelectChat = (chat) => {
        setChat(chat);
        Animated.timing(sidebarWidth, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setSidebarOpen(false); 
    };
    
    const handleCreateNewChat = () => {
        // Close the sidebar when creating a new chat
        Animated.timing(sidebarWidth, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();

        setSidebarOpen(false); // Close the sidebar
        setChat([]);  // Clear current chat
        setUserInput(""); // Reset input field
    };

    const renderChatItem = ({ item }) => {
        return (
            <ChatBubble
                role={item.role}
                text={item.parts[0].text}
                onSpeech={() => handleSpeech(item.parts[0].text)}
            />
        );
    };

    return (
        <LinearGradient
            colors={["#91C7B1", "#CAE9FF"]}
            style={styles.gradientBackground}
        >
            <View style={styles.container}>
                
                    <Animated.View
                    style={[
                        styles.sidebar,
                        { width: sidebarWidth },
                    ]}
                    >
                    
                    <TouchableOpacity
                        style={styles.sidebarItem}
                        onPress={handleCreateNewChat}  // Close sidebar and reset chat when creating new
                    >
                        {sidebarOpen && (
                        <Text style={styles.sidebarText}>New Chat +</Text>
                        )}
                    </TouchableOpacity>
                    
                    <Text style={styles.recentChatsTitle}>Recent Chats</Text>
                    
                    <FlatList
                        data={recentChats}
                        renderItem={({ item, index }) => (
                            <View style={styles.recentChatItem}>
                                <TouchableOpacity
                                    onPress={() => handleSelectChat(item)}
                                >
                                    <Text style={styles.sidebarText}>
                                        Chat {index + 1}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleRemoveChat(index)}
                                >
                                    <Text style={styles.removeText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                    />
                    </Animated.View>

                <View style={styles.paddingForTop}></View>

            <View
                    style={[styles.chatContainer, { marginLeft: sidebarOpen ? 160 : 0 }]}
            >
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={toggleSidebar}
                    >
                            <View style={styles.line} />
                            <View style={styles.line} />
                            <View style={styles.line} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Healio</Text>
                    <Text style={styles.stitle}>Your Mental Health Care Chatbot</Text>
                    
                    {/* Conditionally render chat output only when sidebar is closed */}
                    {!sidebarOpen && (
                        <FlatList
                            data={chat}
                            renderItem={renderChatItem}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={styles.chatList}
                        />
                    )}
                    
                    {!sidebarOpen && (
                        <>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type your message..."
                                    placeholderTextColor="#aaa"
                                    value={userInput}
                                    onChangeText={setUserInput}
                                />
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleUserInput}
                                >
                                    <Text style={styles.buttonText}>Send</Text>
                                </TouchableOpacity>
                            </View>
                            {loading && <ActivityIndicator style={styles.loading} color="black" />}
                            {error && <Text style={styles.error}>{error}</Text>}
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveChat}
                            >
                                <Text style={styles.saveButtonText}>Save Chat</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    container: {
        flexDirection: "row",
        flex: 1,
        paddingTop: 20,
    },
    paddingForTop: {
        padding: 20,
    },
    sidebar: {
        backgroundColor: "#fff",
        borderRightWidth: 1,
        borderRightColor: "#ddd",
        height: "100%",
        padding: 20,
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 1000,
    },
    sidebarItem: {
        padding: 20,
        marginBottom: 20,
    },
    toggleButton: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        backgroundColor: "lightblue",
        borderRadius: 5,
    },
    line: {
        width: 30,
        height: 4,
        backgroundColor: 'black',
        marginVertical: 2,
        borderRadius: 5,
      },
    recentChatsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    recentChatItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    removeText: {
        color: "red",
    },
    chatContainer: {
        flex: 1,
        padding: 16,
        marginLeft: 0,
    },
    title: {
        marginTop: 5,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        fontFamily: "monospace",
    },
    stitle: {
        textAlign: "center",
        fontSize: 12,
        color: "#777",
        marginBottom: 20,
        fontFamily: "monospace",
    },
    chatList: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "black",
        borderRadius: 5,
        padding: 10,
    },
    button: {
        backgroundColor: "#4CAF50",
        padding: 10,
        borderRadius: 5,
        marginLeft: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
    },
    loading: {
        marginTop: 20,
    },
    error: {
        color: "red",
        marginTop: 10,
    },
    saveButton: {
        backgroundColor: "green",
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
    },
});

export default Healio;
