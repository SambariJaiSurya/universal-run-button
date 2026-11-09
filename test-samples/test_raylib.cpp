#include "raylib.h"

int main(void) {
    // Initialize window
    InitWindow(400, 300, "Raylib Auto-Detection Test");
    SetTargetFPS(60);

    while (!WindowShouldClose()) {
        BeginDrawing();
            ClearBackground(RAYWHITE);
            DrawText("Raylib detected automatically!", 40, 130, 20, DARKGRAY);
        EndDrawing();
        break; // Auto-exit after 1 frame during automated tests
    }

    CloseWindow();
    return 0;
}

