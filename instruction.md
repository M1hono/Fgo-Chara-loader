一个为Vitepress服务的自定义Layout，md文件的路径在md/chara/fgo.md。vue文件放在.vitepress/theme/components/Chara/Fgo.vue。
你现在是一个专业的程序员，需要实现一个功能齐全的网站，你设计的UI需要尽可能的简洁，并且需要尽可能的减少用户的操作，同时保持美观。

md文档在/chara/fgo.md。

使用自定义的主题Layout。

你需要的就是实现一个自定义Layout，一个实现功能的组件，做好所有的配置。

需要设计非常非常美观。
1. 需要实现一个自定义的Layout，布局需要实现以下功能：
    - 一个通过API获取数据，然后根据数据来处理图片的布局。
    - 允许用户搜索英文名字并进行搜索，允许程序通过外部的json定义英文名字与中文名字的映射。
    - 在玩家确认自己的搜索结果后，将结果显示在canvas上。
    - 允许用户点击canvas上的角色图片，然后显示该角色的详细信息。
    - 图片是1024 x 1024 + 1024 x 156 x n 类型的尺寸，其中1024 x 768是角色立绘，余下的是256 x 256为一张的角色差分。
    - canvas需要实现预览角色立绘的部分。
    - 玩家可以通过框选的方式来决定一个裁剪的区域，然后显示裁剪的区域。
    - 需要实现一个按钮，允许玩家将裁剪的区域保存为图片，输出图片。
    - 需要实现一个按钮，允许玩家按照当前的裁剪区域来批量裁剪图片，输出zip文件。
API的地址是https://api.atlasacademy.io/export/NA/nice_servant.json
这是API返回的数据结构（不完整，实际上有更多的数据，每个角色大概有六千行）：
[   
    {
        "id": 100100,
        "collectionNo": 2,
        "name": "Altria Pendragon",
        "originalName": "Altria Pendragon",
        "ruby": "Altria Pendragon",
        "battleName": "Altria",
        "originalBattleName": "Altria",
        "classId": 1,
        "className": "saber",
        "type": "normal",
        "flag": "normal",
        "flags": [],
        "rarity": 5,
        "cost": 16,
        "lvMax": 90,
        "extraAssets": {
            "charaGraph": {
                "ascension": {
                    "1": "https://static.atlasacademy.io/NA/CharaGraph/100100/100100a@1.png",
                    "2": "https://static.atlasacademy.io/NA/CharaGraph/100100/100100a@2.png",
                    "3": "https://static.atlasacademy.io/NA/CharaGraph/100100/100100b@1.png",
                    "4": "https://static.atlasacademy.io/NA/CharaGraph/100100/100100b@2.png"
                },
                "costume": {
                    "100130": "https://static.atlasacademy.io/NA/CharaGraph/100130/100130a.png"
                }
            },
            "faces": {
                "ascension": {
                    "1": "https://static.atlasacademy.io/NA/Faces/f_1001000.png",
                    "2": "https://static.atlasacademy.io/NA/Faces/f_1001001.png",
                    "3": "https://static.atlasacademy.io/NA/Faces/f_1001002.png",
                    "4": "https://static.atlasacademy.io/NA/Faces/f_1001003.png"
                },
                "costume": {
                    "100130": "https://static.atlasacademy.io/NA/Faces/f_1001300.png"
                }
            },
            "charaGraphEx": {},
            "charaGraphName": {},
            "narrowFigure": {
                "ascension": {
                    "1": "https://static.atlasacademy.io/NA/NarrowFigure/100100/100100@0.png",
                    "2": "https://static.atlasacademy.io/NA/NarrowFigure/100100/100100@1.png",
                    "3": "https://static.atlasacademy.io/NA/NarrowFigure/100100/100100@2.png",
                    "4": "https://static.atlasacademy.io/NA/NarrowFigure/100100/100100_2@0.png"
                },
                "costume": {
                    "100130": "https://static.atlasacademy.io/NA/NarrowFigure/100130/100130@0.png"
                }
            },
            "charaFigure": {
                "ascension": {
                    "1": "https://static.atlasacademy.io/NA/CharaFigure/1001000/1001000_merged.png",
                    "2": "https://static.atlasacademy.io/NA/CharaFigure/1001001/1001001_merged.png",
                    "3": "https://static.atlasacademy.io/NA/CharaFigure/1001002/1001002_merged.png"
                },
                "story": {
                    "98060000": "https://static.atlasacademy.io/NA/CharaFigure/98060000/98060000_merged.png"
                },
                "costume": {
                    "100130": "https://static.atlasacademy.io/NA/CharaFigure/1001300/1001300_merged.png"
                }
            },
            "charaFigureForm": {},
            "charaFigureMulti": {},
            "charaFigureMultiCombine": {},
            "charaFigureMultiLimitUp": {},
            "commands": {
                "ascension": {
                    "1": "https://static.atlasacademy.io/NA/Servants/Commands/100100/card_servant_1.png",
                    "2": "https://static.atlasacademy.io/NA/Servants/Commands/100100/card_servant_2.png",
                    "3": "https://static.atlasacademy.io/NA/Servants/Commands/100100/card_servant_3.png"
                },
                "costume": {
                    "100130": "https://static.atlasacademy.io/NA/Servants/Commands/100100/card_servant_11.png"
                }
            },
            "status": {
                "ascension": {
                    "1": "https://static.atlasacademy.io/NA/Servants/Status/100100/status_servant_1.png",
                    "2": "https://static.atlasacademy.io/NA/Servants/Status/100100/status_servant_2.png",
                    "3": "https://static.atlasacademy.io/NA/Servants/Status/100100/status_servant_3.png"
                },
                "costume": {
                    "100130": "https://static.atlasacademy.io/NA/Servants/Status/100100/status_servant_11.png"
                }
            },
            "equipFace": {},
            "image": {
                "story": {
                    "0": "https://static.atlasacademy.io/NA/Image/cut171_token_101/cut171_token_101.png",
                    "1": "https://static.atlasacademy.io/NA/Image/cut481_doujinshi07/cut481_doujinshi07.png",
                    "2": "https://static.atlasacademy.io/NA/Image/cut481_doujinshi07_2/cut481_doujinshi07_2.png",
                    "3": "https://static.atlasacademy.io/NA/Image/cut481_doujinshi11/cut481_doujinshi11.png"
                }
            },
            "spriteModel": {
                "ascension": {
                    "0": "https://static.atlasacademy.io/NA/Servants/100100/manifest.json"
                },
                "costume": {
                    "100130": "https://static.atlasacademy.io/NA/Servants/100130/manifest.json"
                }
            },
            "charaGraphChange": {},
            "narrowFigureChange": {},
            "facesChange": {}
        },

你需要处理的是

            "charaFigure": {
                "ascension": {
                    "1": "https://static.atlasacademy.io/NA/CharaFigure/1001000/1001000_merged.png",
                    "2": "https://static.atlasacademy.io/NA/CharaFigure/1001001/1001001_merged.png",
                    "3": "https://static.atlasacademy.io/NA/CharaFigure/1001002/1001002_merged.png"
                },
                "story": {
                    "98060000": "https://static.atlasacademy.io/NA/CharaFigure/98060000/98060000_merged.png"
                },
                "costume": {
                    "100130": "https://static.atlasacademy.io/NA/CharaFigure/1001300/1001300_merged.png"
                }
            },
的部分。
需要提供一个切换的按钮，允许玩家切换到不同的阶段，比如1001000/1001000_merged.png到1001001/1001001_merged.png到1001002/1001002_merged.png到98060000/98060000_merged.png到100130/1001300_merged.png。
处理图片的部分要参考python文件sample.py,严格遵循python文件的逻辑，包括但不限于框选裁剪范围时渲染那虚线范围的部分。