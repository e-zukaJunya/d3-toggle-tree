// JavaScript source code
$(function () {
    const data = {
        "name": "A",
        "children": [{
            "name": "B"
        },
        {
            "name": "C",
            "children": [{
                "name": "D"
            }, {
                "name": "E"
            }, {
                "name": "F"
            }]
        },
        {
            "name": "G"
        },
        {
            "name": "H",
            "children": [{
                "name": "I"
            }, {
                "name": "J"
            }]
        },
        {
            "name": "K"
        }
        ]
    };

    const rectSize = {
        height: 20,
        width: 40
    }

    const baseSpace = {
        padding: 30,
        height: 50,
        width: 100
    }

    let root = d3.hierarchy(data);
    let tree = d3.tree()
    tree(root);
    root.count();

    //svg要素
    const height = root.value * rectSize.height + (root.value - 1) * (baseSpace.height - rectSize.height) + baseSpace.padding * 2;
    const width = (root.height + 1) * rectSize.width + root.height * (baseSpace.width - rectSize.width) + baseSpace.padding * 2;
    const svg = d3.select("body").append("svg").attr("width", width).attr("height", height)

    //階層探索
    const seekParent = (hierarchy, name) => {
        const crntHrcy = hierarchy.parent.children
        const target = crntHrcy.find((contents) => contents.data.name == name);
        return target ? crntHrcy : seekParent(crntHrcy[0].parent, name);
    }

    //自分より上にいる末端ノードの数を配列として取り出す
    const calcNode = (ary, crntData) => {
        const NumOfNodes = ary.map((item, idx, ary) => {
            //階層探索
            const myHierarchy = seekParent(crntData, item.name)
            //自分のインデックス取得
            var myIdx = myHierarchy.findIndex((contents) => contents.data.name == item.name);
            //この階層で今のデータより上のValueをすべて加算
            const fitered = myHierarchy.filter((hrcyItem, hrcyIdx, hrcyAry) => hrcyIdx < myIdx)
            if (fitered.length !== 0) {
                return fitered.reduce((previous, current, index, array) => previous + current.value, 0)
            }
            return 0
        })
        return NumOfNodes
    }

    //位置決め
    const definePos = () => {
        root.each((d) => {
            //y座標と位置記憶用のy0
            d.y = d.depth * baseSpace.width;
            d.y0 = d.y;

            //x座標と位置記憶用のx0
            if (d.depth === 0) {
                //rootの場合
                posX = baseSpace.padding
            } else {
                //親をたどる配列から階層とバインドされたデータを抽出
                const ancestorValues = d.ancestors().map((item, idx, ary) => {
                    var json = {
                        depth: item.depth,
                        name: item.data.name
                    }
                    return json
                })
                //自分より上にいる末端ノードの数を配列として取り出す
                const leaves = calcNode(ancestorValues.slice(0, ancestorValues.length - 1), d)
                //ノードの数を合計してx座標を計算
                const sumLeaves = leaves.reduce((previous, current, index, array) => previous + current)
                posX = baseSpace.padding + sumLeaves * baseSpace.height
            }
            d.x = posX
            d.x0 = d.x
        })
    }

    //全体g要素設定
    let g = svg.append("g").attr("transform", "translate(50,0)");

    //クリック時の関数呼び出し
    const toggle = (d) => {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }

    //要素更新関数
    let i = 0;
    const update = (source) => {
        //位置決め
        root.count();
        definePos();

        // ノードデータ設定
        let node = g.selectAll('.node').data(root.descendants(), (d) => { return d.id || (d.id = ++i); });

        // ノード enter領域の設定
        let nodeEnter = node
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", "translate(" + source.y0 + "," + source.x0 + ")")
            .on("click", (d) => {
                toggle(d);
                update(d);
            });

        nodeEnter.append("rect")
            .attr("width", rectSize.width)
            .attr("height", rectSize.height)
            .attr("fill", (d) => { return d._children ? "lightsteelblue" : "#fff"; })
            .attr("stroke", "black")

        nodeEnter.append("text")
            .text((d) => d.data.name)
            .attr("transform", "translate(" + 2 + "," + 15 + ")")
            .style("fill-opacity", 1e-6);

        // ノード enter+update領域の設定
        var nodeUpdate = nodeEnter.merge(node);
        var duration = 200;

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("rect")
            .attr("width", rectSize.width)
            .attr("height", rectSize.height)
            .attr("fill", (d) => { return d._children ? "lightsteelblue" : "#fff"; })
            .attr("stroke", "black")

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // ノード exit領域の設定
        var nodeExit = node
            .exit()
            .transition()
            .duration(duration)
            .attr("transform", "translate(" + source.y + "," + source.x + ")")
            .remove();

        nodeExit.select("rect")
            .attr("width", 1e-6)
            .attr("height", 1e-6)

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // pathデータ設定
        var link = g.selectAll(".link")
            .data(root.links(), (d) => d.target.id)

        // path enter領域のsvg要素定義
        var linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr("d",
                "M" + source.y0 + "," + source.x0 +
                "L" + source.y0 + "," + source.x0 +
                " " + source.y0 + "," + source.x0 +
                " " + source.y0 + "," + source.x0)
            .attr("transform", "translate(0," + rectSize.height / 2 + ")");

        // path enter+update領域の設定
        var linkUpdate = linkEnter.merge(link);
        linkUpdate.transition()
            .duration(duration)
            .attr("d", function (d) {
                return "M" + d.target.y + "," + d.target.x +
                    "L" + (d.source.y + rectSize.width + (baseSpace.width - rectSize.width) / 2) + "," + d.target.x +
                    " " + (d.source.y + rectSize.width + (baseSpace.width - rectSize.width) / 2) + "," + d.source.x +
                    " " + (d.source.y + rectSize.width) + "," + d.source.x
            })

        // path exit領域の設定
        link.exit()
            .transition()
            .duration(duration)
            .attr("d",
                "M" + source.y0 + "," + source.x0 +
                "L" + source.y0 + "," + source.x0 +
                " " + source.y0 + "," + source.x0 +
                " " + source.y0 + "," + source.x0)
            .remove();
    }

    update(root)
})