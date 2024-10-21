import os
import random
from PIL import Image, ImageTk
import tkinter as tk
from tkinter import filedialog, colorchooser, messagebox, ttk
import numpy as np
import cv2
import threading

class ImageProcessorApp:
    def __init__(self, master):
        self.master = master
        self.master.title("角色立绘图处理程序")
        self.master.geometry("1200x800")

        self.input_image = None
        self.body = None
        self.expressions = []
        self.full_images = []
        self.current_image = None
        self.bg_color = None
        self.output_folder = None
        self.crop_start = None
        self.crop_rect = None
        self.size_text = None

        self.create_widgets()

    def create_widgets(self):
        self.frame = tk.Frame(self.master)
        self.frame.pack(fill=tk.BOTH, expand=True)

        self.canvas = tk.Canvas(self.frame, width=1024, height=600)
        self.canvas.pack(side=tk.LEFT, padx=10, pady=10)
        self.canvas.bind("<ButtonPress-1>", self.start_crop)
        self.canvas.bind("<B1-Motion>", self.draw_crop)
        self.canvas.bind("<ButtonRelease-1>", self.end_crop)

        button_frame = tk.Frame(self.frame)
        button_frame.pack(side=tk.RIGHT, padx=10, pady=10)

        self.select_btn = tk.Button(button_frame, text="选择图片", command=self.select_and_process_image)
        self.select_btn.pack(pady=5)

        self.progress_bar = ttk.Progressbar(button_frame, orient="horizontal", length=200, mode="determinate")
        self.progress_bar.pack(pady=5)

        self.preview_btn = tk.Button(button_frame, text="预览下一张", command=self.preview_next_image, state=tk.DISABLED)
        self.preview_btn.pack(pady=5)

        self.color_btn = tk.Button(button_frame, text="选择背景颜色", command=self.choose_bg_color, state=tk.DISABLED)
        self.color_btn.pack(pady=5)

        self.save_btn = tk.Button(button_frame, text="保存裁剪后的图片", command=self.save_cropped_images, state=tk.DISABLED)
        self.save_btn.pack(pady=5)

    def select_and_process_image(self):
        file_path = filedialog.askopenfilename(filetypes=[("Image files", "*.png *.jpg *.jpeg")])
        if file_path:
            self.input_image = Image.open(file_path)
            self.output_folder = os.path.dirname(file_path)
            self.progress_bar["value"] = 0
            threading.Thread(target=self.process_image, daemon=True).start()

    def process_image(self):
        rough_folder = os.path.join(self.output_folder, "rough")
        modifying_folder = os.path.join(self.output_folder, "modifying")
        background_folder = os.path.join(modifying_folder, "background")
        os.makedirs(rough_folder, exist_ok=True)
        os.makedirs(background_folder, exist_ok=True)

        # 处理身体图像
        self.body = self.input_image.crop((0, 0, 1024, 768))
        self.body.save(os.path.join(background_folder, "body.png"))
        self.body.save(os.path.join(rough_folder, "body.png"))
        self.master.after(0, lambda: self.progress_bar.step(10))

        # 动态计算差分数量
        body_height = 768
        expression_size = 256
        expressions_per_row = 1024 // expression_size  # 应该是4
        remaining_height = self.input_image.height - body_height
        expression_rows = remaining_height // expression_size
        total_expressions = expressions_per_row * expression_rows

        # 处理所有差分
        self.expressions = []
        for i in range(total_expressions):
            row = i // expressions_per_row
            col = i % expressions_per_row
            y = body_height + row * expression_size
            x = col * expression_size
            
            expression = self.input_image.crop((x, y, x + expression_size, y + expression_size))
            self.expressions.append(expression)
            expression.save(os.path.join(rough_folder, f"expression_{i+1}.png"))
            
        self.master.after(0, lambda: self.progress_bar.step(20))

        # 生成完整立绘
        self.full_images = [self.body]
        body_cv = cv2.cvtColor(np.array(self.body), cv2.COLOR_RGB2BGR)
        
        for i, expr in enumerate(self.expressions):
            expr_cv = cv2.cvtColor(np.array(expr), cv2.COLOR_RGBA2BGRA)
            result = cv2.matchTemplate(body_cv, expr_cv[:,:,:3], cv2.TM_SQDIFF_NORMED)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
            top_left = min_loc
            full_img = self.body.copy()
            full_img.paste(expr, top_left, expr)
            self.full_images.append(full_img)
            full_img.save(os.path.join(modifying_folder, f"full_image_{i+1}.png"))
            self.master.after(0, lambda: self.progress_bar.step(70 / len(self.expressions)))

        self.master.after(0, self.finish_processing)

    def finish_processing(self):
        self.display_random_image()
        self.preview_btn.config(state=tk.NORMAL)
        self.color_btn.config(state=tk.NORMAL)
        self.progress_bar["value"] = 100
        messagebox.showinfo("处理完成", f"图片处理完成，结果保存在 {self.output_folder}")

    def display_image(self, image):
        self.photo = ImageTk.PhotoImage(image)
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo)
        self.current_image = image

    def display_random_image(self):
        if self.full_images:
            random_image = random.choice(self.full_images)
            self.display_image(random_image)

    def preview_next_image(self):
        if self.full_images:
            current_index = self.full_images.index(self.current_image)
            next_index = (current_index + 1) % len(self.full_images)
            self.display_image(self.full_images[next_index])

    def start_crop(self, event):
        if self.crop_rect:
            self.canvas.delete(self.crop_rect)
        if self.size_text:
            self.canvas.delete(self.size_text)
        self.crop_start = (event.x, event.y)
        self.crop_rect = self.canvas.create_rectangle(event.x, event.y, event.x, event.y, outline='red', dash=(4, 4))
        self.size_text = self.canvas.create_text(event.x, event.y-10, text="0x0", fill="red")

    def draw_crop(self, event):
        if self.crop_start:
            size = min(abs(event.x - self.crop_start[0]), abs(event.y - self.crop_start[1]))
            x1, y1 = self.crop_start
            if event.x < self.crop_start[0]: x1 = self.crop_start[0] - size
            if event.y < self.crop_start[1]: y1 = self.crop_start[1] - size
            x2, y2 = x1 + size, y1 + size
            self.canvas.coords(self.crop_rect, x1, y1, x2, y2)
            self.canvas.itemconfig(self.size_text, text=f"{size}x{size}")
            self.canvas.coords(self.size_text, (x1+x2)/2, y1-10)

    def end_crop(self, event):
        if self.crop_rect:
            x1, y1, x2, y2 = self.canvas.coords(self.crop_rect)
            self.crop_area = (int(x1), int(y1), int(x2), int(y2))
            self.save_btn.config(state=tk.NORMAL)

    def choose_bg_color(self):
        color = colorchooser.askcolor(title="选择背景颜色")
        if color[1]:
            self.bg_color = color[1]

    def save_cropped_images(self):
        if not hasattr(self, 'crop_area') or not self.bg_color:
            messagebox.showwarning("警告", "请先选择裁剪区域和背景颜色")
            return

        finish_folder = os.path.join(self.output_folder, "finish")
        os.makedirs(finish_folder, exist_ok=True)

        for i, img in enumerate(self.full_images):
            cropped = img.crop(self.crop_area)
            bg = Image.new('RGBA', cropped.size, self.bg_color)
            bg.paste(cropped, (0, 0), cropped)
            bg.save(os.path.join(finish_folder, f"final_image_{i+1}.png"))

        messagebox.showinfo("保存完成", f"裁剪后的图片已保存到 {finish_folder}")

def main():
    root = tk.Tk()
    app = ImageProcessorApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()