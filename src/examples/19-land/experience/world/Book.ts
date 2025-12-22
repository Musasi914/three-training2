import gsap from "gsap";
import Experience from "../Experience";
import * as THREE from "three";

export class Book {
  static pageWidth = 1.28;
  static pageHeight = 1.71;
  static pageHalfWidth = Book.pageWidth / 2;
  static pageDepth = 0.003;
  static pageSegmentCount = 10;
  static pageSegmentWidth = Book.pageWidth / Book.pageSegmentCount;

  experience: Experience;
  scene: Experience["scene"];
  resource: Experience["resource"];

  pageCount: number;

  pageGeometry: THREE.BoxGeometry;
  pageMaterials: THREE.MeshStandardMaterial[];

  group: THREE.Group;
  pagesGroup: THREE.Group[];

  bookClosed = false;

  constructor(pages: { front: string; back: string }[]) {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.resource = this.experience.resource;

    this.pageCount = pages.length;

    this.pageGeometry = new THREE.BoxGeometry(
      Book.pageWidth,
      Book.pageHeight,
      Book.pageDepth,
      Book.pageSegmentCount
    );
    this.pageMaterials = [
      new THREE.MeshStandardMaterial({ color: new THREE.Color(0xffffff) }),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(0x111111) }),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(0xffffff) }),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(0xffffff) }),
    ];

    this.group = new THREE.Group();
    this.pagesGroup = [];
    pages.forEach((page, i) => {
      const singlePageGroup = new THREE.Group();
      singlePageGroup.userData.isOpen = false;
      const mesh = this.createPage(page, i, singlePageGroup);
      singlePageGroup.add(mesh);
      this.pagesGroup.push(singlePageGroup);
      this.group.add(singlePageGroup);
    });
  }

  private createPage(
    page: { front: string; back: string },
    index: number,
    singlePageGroup: THREE.Group
  ) {
    const picture1 =
      page.front === "book-cover"
        ? "book-cover"
        : this.resource.items[page.front];
    const picture2 =
      page.back === "book-back" ? "book-back" : this.resource.items[page.back];

    if (picture1.isTexture) {
      picture1.colorSpace = THREE.SRGBColorSpace;
    }
    if (picture2.isTexture) {
      picture2.colorSpace = THREE.SRGBColorSpace;
    }

    const geometry = this.createPageGeometry();
    const bones = this.createBones();
    const material = [
      ...this.pageMaterials,
      new THREE.MeshStandardMaterial(
        page.front === "book-cover"
          ? {
              color: new THREE.Color(0xffffff),
              roughness: 0,
            }
          : { map: picture1, roughness: 0 }
      ),
      new THREE.MeshStandardMaterial(
        page.back === "book-back"
          ? { color: new THREE.Color(0x111111), roughness: 0 }
          : { map: picture2, roughness: 0 }
      ),
    ];
    const mesh = new THREE.SkinnedMesh(geometry, material);
    const skelton = new THREE.Skeleton(bones);
    mesh.add(bones[0]);
    mesh.bind(skelton);

    mesh.position.x = Book.pageWidth / 2;
    mesh.position.z = -Book.pageDepth * index;
    singlePageGroup.rotation.y = THREE.MathUtils.degToRad(index * 0.2);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    singlePageGroup.userData.bones = bones;

    return mesh;
  }

  private createPageGeometry() {
    const geometry = this.pageGeometry;
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const skinIndices = [];
    const skinWeights = [];

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      // vertex.xが-Book.pageHalfWidthからBook.pageHalfWidthまでの範囲を0から1に正規化
      const x = vertex.x + Book.pageHalfWidth;
      const skinIndex = Math.floor(x / Book.pageSegmentWidth);

      skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
      skinWeights.push(1, 0, 0, 0);
    }

    geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(skinIndices, 4)
    );
    geometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(skinWeights, 4)
    );

    return geometry;
  }

  private createBones() {
    const bones = [];

    let prevBone = new THREE.Bone();
    bones.push(prevBone);
    prevBone.position.x = -Book.pageHalfWidth;

    for (let i = 0; i < Book.pageSegmentCount; i++) {
      const bone = new THREE.Bone();
      bone.position.x = Book.pageSegmentWidth;
      bones.push(bone);
      prevBone.add(bone);
      prevBone = bone;
    }

    return bones;
  }

  turnPage(targetIndex: number) {
    this.bookClosed = targetIndex === 0;
    for (let i = 0; i < this.pagesGroup.length; i++) {
      const pageGroup = this.pagesGroup[i];
      if (i < targetIndex) {
        pageGroup.userData.isOpen = true;
      } else {
        pageGroup.userData.isOpen = false;
      }

      let targetRotation = THREE.MathUtils.degToRad(i);
      pageGroup.position.z = Book.pageDepth * i;

      if (i === 1) {
        if (targetIndex === 1) {
          gsap.to(pageGroup.position, {
            z: Book.pageDepth * i + 0.1,
            duration: 0.1,
            delay: 0.4,
            ease: "power2.inOut",
          });
        } else {
          gsap.to(pageGroup.position, {
            z: Book.pageDepth * i,
            duration: 0.1,
            delay: 0.4,
            ease: "power2.inOut",
          });
        }
      }

      // gsap.to(pageGroup.rotation, {
      //   y: -targetRotation,
      //   duration: 0.7,
      //   ease: "power2.inOut",
      // });

      if (targetIndex === 0) {
        gsap.to(pageGroup.rotation, {
          y: targetRotation,
          duration: 0.7,
          ease: "power2.inOut",
        });
      } else if (targetIndex === this.pageCount) {
        gsap.to(pageGroup.rotation, {
          y: targetRotation - Math.PI,
          duration: 0.7,
          ease: "power2.inOut",
        });
      } else {
        gsap.to(pageGroup.rotation, {
          y: -Math.PI / 2 + THREE.MathUtils.degToRad(i),
          duration: 0.7,
          ease: "power2.inOut",
        });
      }

      if (pageGroup.userData.isOpen) {
        const bones = pageGroup.userData.bones;
        for (let j = 0; j < bones.length; j++) {
          const bone = bones[j];
          const boneTargetRotation =
            j < 4
              ? Math.sin(j * 0.15 + 0.25)
              : j > 6
              ? -Math.sin(j * 0.15 * 0.2)
              : 0;
          gsap.to(bone.rotation, {
            y:
              targetIndex === 0
                ? 0
                : targetIndex === this.pageCount
                ? 0
                : -boneTargetRotation,
            duration: 0.7,
            ease: "power2.inOut",
          });
        }
      } else {
        const bones = pageGroup.userData.bones;
        for (let j = 0; j < bones.length; j++) {
          const bone = bones[j];
          const boneTargetRotation =
            j < 4
              ? Math.sin(j * 0.15 + 0.25)
              : j > 6
              ? -Math.sin(j * 0.15 * 0.2)
              : 0;
          gsap.to(bone.rotation, {
            y:
              targetIndex === 0
                ? 0
                : targetIndex === this.pageCount
                ? 0
                : boneTargetRotation,
            duration: 0.7,
            ease: "power2.inOut",
          });
        }
      }
    }
  }
}
