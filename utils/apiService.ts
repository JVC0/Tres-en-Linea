import { Platform } from "react-native";


const getApiBaseUrl = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://localhost:5000";
};

const API_BASE_URL = getApiBaseUrl();

export interface DeviceInfo {
  connected: boolean;
  wins: number;
  losses: number;
  ratio: number;
}

export interface MatchInfo {
  match_id: string;
  players: { [deviceId: string]: string };
  board_size: number;
}

export interface WaitingStatus {
  status: "waiting" | "matched" | "idle";
  match_id?: string;
  players?: { [deviceId: string]: string };
  board_size?: number;
}

export interface GameState {
  board: string[][];
  turn: string;
  winner: string | null;
  size: number;
  players: { [deviceId: string]: string };
}

class ApiService {
  private deviceId: string | null = null;

  async registerDevice(alias?: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alias }),
      });

      const data = await response.json();
      this.deviceId = data.device_id;
      return data.device_id;
    } catch (error) {
      console.error("Error registering device:", error);
      throw error;
    }
  }

  async createMatch(size: number): Promise<MatchInfo | { message: string }> {
    if (!this.deviceId) throw new Error("Device not registered");

    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_id: this.deviceId,
        size: size,
      }),
    });

    return await response.json();
  }

  async getWaitingStatus(): Promise<WaitingStatus> {
    if (!this.deviceId) throw new Error("Device not registered");

    const response = await fetch(
      `${API_BASE_URL}/matches/waiting-status?device_id=${this.deviceId}`
    );

    return await response.json();
  }

  async makeMove(matchId: string, x: number, y: number): Promise<any> {
    if (!this.deviceId) throw new Error("Device not registered");

    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/moves`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_id: this.deviceId,
        x: x,
        y: y,
      }),
    });

    return await response.json();
  }

  async getGameState(matchId: string): Promise<GameState> {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}`);
    return await response.json();
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.deviceId) throw new Error("Device not registered");

    const response = await fetch(
      `${API_BASE_URL}/devices/${this.deviceId}/info`
    );
    return await response.json();
  }

  getCurrentDeviceId(): string | null {
    return this.deviceId;
  }

  forgetDevice(): void {
    this.deviceId = null;
  }

  async resetDevice(alias?: string): Promise<string> {
    this.forgetDevice();
    return await this.registerDevice(alias);
  }

  async keepAlive(): Promise<void> {
    if (!this.deviceId) return;
    
    try {
      await this.getWaitingStatus();
    } catch (error) {
      console.error('Error keeping device alive:', error);
      this.forgetDevice();
    }
  }
}

export const apiService = new ApiService();
