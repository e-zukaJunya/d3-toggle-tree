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

    //svg�v�f
    const height = root.value * rectSize.height + (root.value - 1) * (baseSpace.height - rectSize.height) + baseSpace.padding * 2;
    const width = (root.height + 1) * rectSize.width + root.height * (baseSpace.width - rectSize.width) + baseSpace.padding * 2;
    const svg = d3.select("body").append("svg").attr("width", width).attr("height", height)

    //�K�w�T��
    const seekParent = (hierarchy, name) => {
        const crntHrcy = hierarchy.parent.children
        const target = crntHrcy.find((contents) => contents.data.name == name);
        return target ? crntHrcy : seekParent(crntHrcy[0].parent, name);
    }

    //��������ɂ��閖�[�m�[�h�̐���z��Ƃ��Ď��o��
    const calcNode = (ary, crntData) => {
        const NumOfNodes = ary.map((item, idx, ary) => {
            //�K�w�T��
            const myHierarchy = seekParent(crntData, item.name)
            //�����̃C���f�b�N�X�擾
            var myIdx = myHierarchy.findIndex((contents) => contents.data.name == item.name);
            //���̊K�w�ō��̃f�[�^�����Value�����ׂĉ��Z
            const fitered = myHierarchy.filter((hrcyItem, hrcyIdx, hrcyAry) => hrcyIdx < myIdx)
            if (fitered.length !== 0) {
                return fitered.reduce((previous, current, index, array) => previous + current.value, 0)
            }
            return 0
        })
        return NumOfNodes
    }

    //�ʒu����
    const definePos = () => {
        root.each((d) => {
            //y���W�ƈʒu�L���p��y0
            d.y = d.depth * baseSpace.width;
            d.y0 = d.y;

            //x���W�ƈʒu�L���p��x0
            if (d.depth === 0) {
                //root�̏ꍇ
                posX = baseSpace.padding
            } else {
                //�e�����ǂ�z�񂩂�K�w�ƃo�C���h���ꂽ�f�[�^�𒊏o
                const ancestorValues = d.ancestors().map((item, idx, ary) => {
                    var json = {
                        depth: item.depth,
                        name: item.data.name
                    }
                    return json
                })
                //��������ɂ��閖�[�m�[�h�̐���z��Ƃ��Ď��o��
                const leaves = calcNode(ancestorValues.slice(0, ancestorValues.length - 1), d)
                //�m�[�h�̐������v����x���W���v�Z
                const sumLeaves = leaves.reduce((previous, current, index, array) => previous + current)
                posX = baseSpace.padding + sumLeaves * baseSpace.height
            }
            d.x = posX
            d.x0 = d.x
        })
    }

    //�S��g�v�f�ݒ�
    let g = svg.append("g").attr("transform", "translate(50,0)");

    //�N���b�N���̊֐��Ăяo��
    const toggle = (d) => {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }

    //�v�f�X�V�֐�
    let i = 0;
    const update = (source) => {
        //�ʒu����
        root.count();
        definePos();

        // �m�[�h�f�[�^�ݒ�
        let node = g.selectAll('.node').data(root.descendants(), (d) => { return d.id || (d.id = ++i); });

        // �m�[�h enter�̈�̐ݒ�
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

        // �m�[�h enter+update�̈�̐ݒ�
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

        // �m�[�h exit�̈�̐ݒ�
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

        // path�f�[�^�ݒ�
        var link = g.selectAll(".link")
            .data(root.links(), (d) => d.target.id)

        // path enter�̈��svg�v�f��`
        var linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr("d",
                "M" + source.y0 + "," + source.x0 +
                "L" + source.y0 + "," + source.x0 +
                " " + source.y0 + "," + source.x0 +
                " " + source.y0 + "," + source.x0)
            .attr("transform", "translate(0," + rectSize.height / 2 + ")");

        // path enter+update�̈�̐ݒ�
        var linkUpdate = linkEnter.merge(link);
        linkUpdate.transition()
            .duration(duration)
            .attr("d", function (d) {
                return "M" + d.target.y + "," + d.target.x +
                    "L" + (d.source.y + rectSize.width + (baseSpace.width - rectSize.width) / 2) + "," + d.target.x +
                    " " + (d.source.y + rectSize.width + (baseSpace.width - rectSize.width) / 2) + "," + d.source.x +
                    " " + (d.source.y + rectSize.width) + "," + d.source.x
            })

        // path exit�̈�̐ݒ�
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